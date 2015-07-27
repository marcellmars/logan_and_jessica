# -*- coding: utf-8 -*-

import sys
import socket
import ssl
import select
import httplib
import urlparse
import threading
import gzip
import zlib
import base64
import urllib
from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
from SocketServer import ThreadingMixIn
from cStringIO import StringIO


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    address_family = socket.AF_INET6
    daemon_threads = True

    def handle_error(self, request, client_address):
        cls, e = sys.exc_info()[:2]
        if cls is socket.error or cls is ssl.SSLError:
            pass
        else:
            return HTTPServer.handle_error(self, request, client_address)


class ProxyRequestHandler(SimpleHTTPRequestHandler):
    timeout = 5
    lock = threading.Lock()

    def __init__(self, *args, **kwargs):
        self.tls = threading.local()
        self.tls.conns = {}
        self.key = base64.b64encode("username:password")

        SimpleHTTPRequestHandler.__init__(self, *args, **kwargs)

    def log_error(self, format, *args):
        if isinstance(args[0], socket.timeout):
            return
        self.log_message(format, *args)

    def log_message(self, format, *args):
        pass

    def do_HEAD(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_AUTHHEAD(self):
        self.send_response(407)
        self.send_header('Proxy-Authenticate',
                         'Basic realm=\"Logan & Jessica\"')
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def check_authorization(self):
        if self.headers.get('Proxy-Authorization') is None:
            self.do_AUTHHEAD()
            self.wfile.write('no auth header received')
        elif self.headers.get('Proxy-Authorization') == 'Basic ' + self.key:
            pass
        elif self.headers.get('Proxy-Authorization') != 'Basic ' + self.key:
            self.wfile.write('sorry. change your proxy settings...')

    def do_CONNECT(self):
        self.check_authorization()
        #print("THREAD: {}".format(threading.current_thread()))
        address = self.path.split(':', 1)
        #print("ADDRESS: {}".format(address))
        try:
            address[1] = int(address[1])
        except:
            address[1] = 443

        try:
            s = socket.create_connection(address, timeout=self.timeout)
        except Exception as e:
            self.send_error(502)
            return
        self.send_response(200, 'Connection Established')
        self.end_headers()

        conns = [self.connection, s]
        self.close_connection = 0
        while not self.close_connection:
            rlist, wlist, xlist = select.select(conns, [], conns, self.timeout)
            if xlist or not rlist:
                break
            for r in rlist:
                other = conns[1] if r is conns[0] else conns[0]
                data = r.recv(8192)
                if not data:
                    self.close_connection = 1
                    break
                other.sendall(data)

    def do_GET(self):
        self.check_authorization()

        req = self
        content_length = int(req.headers.get('Content-Length', 0))
        req_body = self.rfile.read(content_length) if content_length else None
        if req.path[0] == '/':
            if isinstance(self.connection, ssl.SSLSocket):
                req.path = "https://%s%s" % (req.headers['Host'], req.path)
                print("GET HTTPS: {}".formaty(req.path))
            else:
                req.path = "http://%s%s" % (req.headers['Host'], req.path)
                print("GET HTTP: {}".formaty(req.path))

        u = urlparse.urlsplit(req.path)
        scheme = u.scheme
        host = u.netloc
        path = (u.path + '?' + u.query if u.query else u.path)
        assert scheme in ('http', 'https')
        if host:
            req.headers['Host'] = host
        req_headers = self.filter_headers(req.headers)
        try:
            if not host in self.tls.conns:
                if scheme == 'https':
                    httpsc = httplib.HTTPSConnection(host,
                                                     timeout=self.timeout)
                    self.tls.conns[host] = httpsc
                else:

                    httpc = httplib.HTTPConnection(host,
                                                   timeout=self.timeout)
                    self.tls.conns[host] = httpc

            conn = self.tls.conns[host]
            conn.request(self.command, path, req_body, dict(req_headers))
            res = conn.getresponse()
            res_body = res.read()
        except Exception as e:
            print("EXCEPTION: {}".format(e))
            if host in self.tls.conns:
                del self.tls.conns[host]
            self.send_error(502)
            return

        version_table = {10: 'HTTP/1.0', 11: 'HTTP/1.1'}
        setattr(res, 'headers', res.msg)
        setattr(res, 'response_version', version_table[res.version])

        res_headers = self.filter_headers(res.headers)
        self.wfile.write("%s %d %s\r\n" % (self.protocol_version,
                                           res.status,
                                           res.reason))
        for line in res_headers.headers:
            self.wfile.write(line)
        self.end_headers()
        self.wfile.write(res_body)
        self.wfile.flush()
        self.wfile.close()

    def filter_headers(self, headers):
        # http://tools.ietf.org/html/rfc2616#section-13.5.1
        hop_by_hop = ('connection',
                      'keep-alive',
                      'proxy-authenticate',
                      'proxy-authorization',
                      'te',
                      'trailers',
                      'transfer-encoding',
                      'upgrade')
        for k in hop_by_hop:
            del headers[k]
        return headers

    def encode_content_body(self, text, encoding):
        if encoding in ('gzip', 'x-gzip'):
            io = StringIO()
            with gzip.GzipFile(fileobj=io, mode='wb') as f:
                f.write(text)
            data = io.getvalue()
        elif encoding == 'deflate':
            data = zlib.compress(text)
        elif encoding == 'identity':
            data = text
        else:
            raise Exception("Unknown Content-Encoding: %s" % encoding)
        return data

    def decode_content_body(self, data, encoding):
        if encoding in ('gzip', 'x-gzip'):
            io = StringIO(data)
            with gzip.GzipFile(fileobj=io) as f:
                text = f.read()
        elif encoding == 'deflate':
            text = zlib.decompress(data)
        elif encoding == 'identity':
            text = data
        else:
            raise Exception("Unknown Content-Encoding: %s" % encoding)
        return text

    do_POST = do_GET
    do_OPTIONS = do_GET


def start_server(HandlerClass=ProxyRequestHandler,
                 ServerClass=ThreadingHTTPServer,
                 protocol="HTTP/1.1"):
    if sys.argv[1:]:
        port = int(sys.argv[1])
    else:
        port = 8080
    server_address = ('', port)

    HandlerClass.protocol_version = protocol
    httpd = ServerClass(server_address, HandlerClass)

    sa = httpd.socket.getsockname()
    print "Serving HTTP Proxy on", sa[0], "port", sa[1], "..."
    httpd.serve_forever()


if __name__ == '__main__':
    # start_server()
    if sys.argv[1:]:
        port = int(sys.argv[1])
    else:
        port = 8080
    server_address = ('', port)

    ProxyRequestHandler.protocol_version = "HTTP/1.1"
    httpd = ThreadingHTTPServer((server_address), ProxyRequestHandler)
    sa = httpd.socket.getsockname()
    print "Serving HTTP Proxy on", sa[0], "port", sa[1], "..."

    #threaded_httpd = threading.Thread(target=httpd.serve_forever)
    #threaded_httpd.start()
    httpd.serve_forever()
