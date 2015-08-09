# -*- coding: utf-8 -*-

import sys
import socket
import ssl
import select
import httplib
import urlparse
import threading
import base64
import uuid
import subprocess
import random
from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
from SocketServer import ThreadingMixIn

DDOS = []


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    #address_family = socket.AF_INET6
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
        self.auth_counter = 0

        SimpleHTTPRequestHandler.__init__(self, *args, **kwargs)

    def log_error(self, format, *args):
        if isinstance(args[0], socket.timeout):
            return
        self.log_message(format, *args)

    # def log_message(self, format, *args):
    #     pass

    def do_HEAD(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_AUTHHEAD(self):
        self.send_response(407)
        self.send_header('Proxy-Authenticate',
                         'Basic realm=\"Logan & Jessica {}\"'.format(self.proxysession))
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def check_authorization(self):
        if self.headers.get('Proxy-Authorization') is None:
            print("NO KEY: {}".format(self.key))
            self.do_AUTHHEAD()
            self.wfile.write('no auth header received')
        elif self.headers.get('Proxy-Authorization') == 'Basic ' + self.key:
            pass
        elif self.headers.get('Proxy-Authorization') != 'Basic ' + self.key:
            global DDOS
            DDOS.append(self.key)
            print("DDOS: {}, LENGTH: {}".format(DDOS, len(DDOS)))
            self.do_AUTHHEAD()
            counter = len([i for i in DDOS if i == self.key])
            if counter > 2:
                DDOS = [i for i in DDOS if i != self.key]
                self.wfile.write('sorry. change your proxy settings...')

    def do_CONNECT(self):
        print("do_CONNECT {}".format(self.headers))
        self.check_authorization()
        # if not self.ssh_proc:
        #     print("SSH TUNNEL KAPUTT!")
        address = self.path.split(':', 1)
        print("do_CONNECT ADDRESS: {}".format(address))
        try:
            address[1] = int(address[1])
        except:
            address[1] = 443

        try:
            s = socket.create_connection(address, timeout=self.timeout)
        except Exception as e:
            print("do_CONNECT EXCEPTION: {}".format(e))
            if self.wfile.closed:
                return
            self.send_error(502, 'Bad gateway')
            return
        self.send_response(200, 'Connection Established')
        self.end_headers()

        conns = [self.connection, s]
        self.close_connection = 0
        while not self.close_connection:
            rlist, wlist, xlist = select.select(conns, [], conns)
            if xlist or not rlist:
                break
            for r in rlist:
                other = conns[1] if r is conns[0] else conns[0]
                data = r.recv(8192)
                if not data:
                    self.close_connection = 1
                    break
                if other:
                    other.sendall(data)

    def do_GET(self):
        self.check_authorization()

        req = self
        print("do_GET ADDRESS: {}".format(req.path))
        content_length = int(req.headers.get('Content-Length', 0))
        req_body = self.rfile.read(content_length) if content_length else None
        if req.path[0] == '/':
            if isinstance(self.connection, ssl.SSLSocket):
                req.path = "https://%s%s" % (req.headers['Host'], req.path)
                print("GET HTTPS: {}".format(req.path))
            else:
                req.path = "http://%s%s" % (req.headers['Host'], req.path)
                print("GET HTTP: {}".format(req.path))

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
            if self.wfile.closed:
                return
            self.send_error(502, 'Bad gateway')
            return

        version_table = {10: 'HTTP/1.0', 11: 'HTTP/1.1'}
        setattr(res, 'headers', res.msg)
        setattr(res, 'response_version', version_table[res.version])

        res_headers = self.filter_headers(res.headers)
        if self.wfile.closed:
            return
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

    do_POST = do_GET
    do_OPTIONS = do_GET




class Proxy():
    def __init__(self, portjess, port=9991):
        self.port = port
        self.portjess = portjess
        self.credentials = self.get_uuid_credentials()
        server_address = ('localhost', port)

        ProxyRequestHandler.portjess = self.portjess
        ProxyRequestHandler.localjess = port
        ProxyRequestHandler.protocol_version = "HTTP/1.1"
        #ProxyRequestHandler.key = base64.b64encode("username:password")

        ProxyRequestHandler.key = self.credentials[2]
        ProxyRequestHandler.proxysession = self.credentials[0][:8]
        self.httpd = ThreadingHTTPServer((server_address), ProxyRequestHandler)

    def start_server(self):
        sa = self.httpd.socket.getsockname()

        print("Serving HTTP Proxy on {} port {}...".format(sa[0], sa[1]))
        print("https://jessica.memoryoftheworld.org/{}/{}:{}".format(self.portjess,
                                                                     self.credentials[0],
                                                                     self.credentials[1]))

        self.httpd.serve_forever()

    def stop_server(self):
        # self.ssh_proc.kill()
        self.httpd.socket.close()

    def get_uuid_credentials(self):
        username = uuid.uuid4().hex
        password = uuid.uuid4().hex
        return (username,
                password,
                base64.b64encode("{}:{}".format(username,
                                                password)))

 #ssh -N -T -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o TCPKeepAlive=yes -l tunnel -R 8787:localhost:8089 ssh.pede.rs -p 443

#ssh -N -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -L 6666:ssh.pede.rs:8787 tunnel@ssh.pede.rs -p 443 (for localhost:6666 proxy)
