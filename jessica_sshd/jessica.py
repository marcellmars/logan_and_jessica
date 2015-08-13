# -*- coding: utf-8 -*-

import subprocess
import random
import datetime
import time

import sys
import socket
import ssl
import select
import httplib
import urlparse
import threading
import base64
import uuid

from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
from SocketServer import ThreadingMixIn

import Tkinter
from multiprocessing import Process, Pipe


DDOS = []

PORT = 9991
PUBLIC_SERVER = "ssh.pede.rs"
PUBLIC_SERVER_PORT = "443"

PHOTO = """
R0lGODlhQAFZAOf/ACoBACsDAS8CBCsEAi8DBTAEBzIFATIGCTQIDTYJBzQNCDYOAjUOCjYPCzcQ
DTkSDzoTETsUEj0WFD4XFUQWEj4YGkAZGz0dBEEaHEIbHUQdH1gaE0cgIUMmAEYjI0clJFMlCEgm
JUonJl8lFEgqJ0wpKEowA04rKlAsK1MvLlYwJVQwL0wzLlYyMFgzMlM4Lls2NXowHpAqJlo6N1Q+
Mlo8PVs9PlFBNFw+QF4/QWBBQ2FDRJY3M2NFRmRGR2ZHSWdISlRPPmlKS/8jJ2xMTldWPm1OT29Q
Uf0rJf0rLHFRUm5UVHJTVHRUVVBhPwB+DvgyKnFXVgaAAhR8DfI3L3NZWBN+GgCGCih5IHZcWyJ8
GUxtOz9yMVVqQURxN3heXTl1M/86NjV3LXlfXv89PXxiYRyJEa1YUH9lZNxOPYNoZ/9IRoZraiKQ
I3V1SohubZ9xFf9PTcViQYtwbzCSLrxoRjuRLo5zcol1coSEAJB1dEeTMkWTOI14da9zR6t1R06T
Oo96d6R6SY5+Y7Z1UWGQQYCHR5J9epOAgpaBfpaDhf9oXJmEgZmGiIqZAP9uWP9uXpuIip6LjaGO
kP99Lv9+J/2AJqOQk/97WKSRlP6COP9/U6aTlf+DMfyFMaeUl6iVmKmWmaWZmqyYm62ZnPSNSKmc
nfWOT6+cnquen6ygoPOTV+6VV66iorCkpM+gf7Omp+iebeeec82oXbSoqLapquOidLerq+Oje7qt
ruGnfeCngrywsN2rhL6yssCztMG1tdezjua8HsO3t+OykMS4uN+1kca5uuK4lMm8vcy/v87BwufB
lcvFxNLFxs7Jx7vjAO7GlNDLydLNy9HSqNTPzbzrAf3VJdbQz/zVMfbRb/nSYvzWPNjS0drV093X
1t7Z2ODa2eLc2/flV/PnT+Tf3ePwPsz/AObh3+rwQOji4eL1N+rk4+zm5e3o5u/q6PDr6fLs6/Tu
7fXw7vfx8Pjz8fv19Pf59v749//5+P/6+fv9+v/8+vz/+/7//AAAACH5BAEKAP8ALAAAAABAAVkA
AAj+AP0JHEiwoMGDCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePIEOKHEmypMmTKFOqXMmypcuX
MGPKTCkvmatLhxJlgjVt38yfQIMKVfkukosASJMmhdDkVr6hUKNKncpQ3pwDSrNm/ZCLqtevYGUO
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
jvzIkBzJkjzJlFzJGhEQADs=
"""


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

    def log_message(self, format, *args):
        pass

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
        # print("do_CONNECT {}".format(self.headers))
        self.check_authorization()
        # if not self.ssh_proc:
        #     print("SSH TUNNEL KAPUTT!")
        address = self.path.split(':', 1)
        # print("do_CONNECT ADDRESS: {}".format(address))
        self.log_text.send(time.time())
        try:
            address[1] = int(address[1])
        except:
            address[1] = 443

        try:
            s = socket.create_connection(address, timeout=self.timeout)
        except Exception as e:
            # print("do_CONNECT EXCEPTION: {}".format(e))
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
        # print("do_GET ADDRESS: {}".format(req.path))
        self.log_text.send(time.time())
        content_length = int(req.headers.get('Content-Length', 0))
        req_body = self.rfile.read(content_length) if content_length else None
        if req.path[0] == '/':
            if isinstance(self.connection, ssl.SSLSocket):
                req.path = "https://%s%s" % (req.headers['Host'], req.path)
                # print("GET HTTPS: {}".format(req.path))
            else:
                req.path = "http://%s%s" % (req.headers['Host'], req.path) 

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
            # print("EXCEPTION: {}".format(e))
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
    def __init__(self, ica, portjess, port=9991):
        self.port = port
        self.portjess = portjess
        self.credentials = self.get_uuid_credentials()
        server_address = ('localhost', port)

        ProxyRequestHandler.portjess = self.portjess
        ProxyRequestHandler.localjess = port
        ProxyRequestHandler.log_text = ica
        ProxyRequestHandler.protocol_version = "HTTP/1.1"
        ProxyRequestHandler.key = self.credentials[2]
        ProxyRequestHandler.proxysession = self.credentials[0][:8]
        self.httpd = ThreadingHTTPServer((server_address), ProxyRequestHandler)

    def start_server(self):
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


class Proxsica:
    def __init__(self, ica, root, label_text, log_text):
        self.root = root
        self.label_text = label_text
        self.log_text = log_text
        self.ica = ica
        self.big_bang = True
        self.logan_ran = False
        self.init_states()

    def init_states(self):
        self.last = time.mktime(datetime.datetime.now().timetuple())
        self.play_mode = "tunnel"
        self.ssh_proc, self.url, self.p = [None] * 3

    def play(self):
        if self.big_bang:
            self.loganica()
            self.big_bang = False
        elif self.play_mode == "copy" or self.play_mode == "copied" and self.url:
            self.root.clipboard_clear()
            self.root.clipboard_append(self.url)
            self.log_text.set("URL has been copied. Send it to Logan.")
            self.play_mode = "copied"
            return

        self.portjess = random.randint(1025, 48000)
        self.server = Proxy(self.ica, self.portjess, PORT)
        self.p = Process(target=self.server.start_server)
        self.p.start()

        self.ssh_proc = subprocess.Popen(['ssh', '-T', '-N', '-g', '-C',
                                          '-c', 'arcfour,aes128-cbc,blowfish-cbc',
                                          '-o', 'TCPKeepAlive=yes',
                                          '-o', 'UserKnownHostsFile=/dev/null',
                                          '-o', 'StrictHostKeyChecking=no',
                                          '-o', 'ServerAliveINterval=60',
                                          '-o', 'ExitOnForwardFailure=yes',
                                          '-o', 'LogLevel=quiet',
                                          '-l', 'tunnel',
                                          '-R', '{}:localhost:{}'.format(self.portjess,
                                                                         PORT),
                                          PUBLIC_SERVER,
                                          '-p', PUBLIC_SERVER_PORT])

        sa = self.server.httpd.socket.getsockname()
        if sa and self.ssh_proc:
            self.play_mode = "copy"
            self.log_text.set("Logan is waiting for the tunnel's URL...")

            self.root.children["tunnel"].grid_forget()
            self.root.children["tunnel"].grid(row=1,
                                              column=0,
                                              sticky=Tkinter.W + Tkinter.E)

            self.root.children["stop"].grid(row=1,
                                            column=1,
                                            sticky=Tkinter.W + Tkinter.E)

            self.label_text.set("Copy Logan's URL")
            prefix = "https://jessica.memoryoftheworld.org"
            self.url = "{}/{}/{}:{}".format(prefix,
                                            self.portjess,
                                            self.server.credentials[0],
                                            self.server.credentials[1])
        else:
            self.label_text.set("Hm... Please restart the app!")

    def stop(self):
        if self.ssh_proc:
            self.ssh_proc.kill()
        if self.p:
            self.p.terminate()
            self.p.join()
            self.server.stop_server()
            self.p = None

        self.root.children["stop"].grid_forget()
        self.root.children["tunnel"].grid_forget()
        self.root.children["tunnel"].grid(row=1,
                                          column=0,
                                          columnspan=2,
                                          sticky=Tkinter.W + Tkinter.E)

        self.label_text.set("Set up a tunnel")
        self.log_text.set("Logan is waiting for the tunnel...")
        self.logan_ran = False
        self.init_states()

    def loganica(self):
        self.root.update()
        n = time.mktime(datetime.datetime.now().timetuple())
        delta = (self.last - n) * -1
        deltas = "{:0>8}".format(datetime.timedelta(seconds=delta))
        randot = random.randint(4, 24)
        if gan.poll():
            self.last = n
            empt = gan.recv()
            if self.play_mode == "copied":
                self.logan_ran = True
                self.log_text.set("{}Logan is running{}{}".format(randot * ".",
                                                                  (24 - randot) * ".",
                                                                  4 * "."))
        elif self.logan_ran and delta > 3:
            self.log_text.set("Last Logan's request {} ago.".format(deltas))


        self.root.after(50, self.loganica)

    def close_all(self):
        self.stop()
        self.root.destroy()




if __name__ == '__main__':
    root = Tkinter.Tk()
    root['bg'] = 'white'
    label_text = Tkinter.StringVar()
    log_text = Tkinter.StringVar()
    label_text.set("Set up a tunnel")
    log_text.set("Logan is waiting for the tunnel...")
    # photo = Tkinter.PhotoImage(file="jessica.gif")
    photo = Tkinter.PhotoImage(data=PHOTO)

    gan, ica = Pipe()

    proksica = Proxsica(ica, root, label_text, log_text)

    stop = Tkinter.Button(root,
                          name="stop",
                          bg="white",
                          fg="#2B0000",
                          activebackground="#EEEAEA",
                          font="-weight bold",
                          highlightthickness=1,
                          relief=Tkinter.FLAT,
                          borderwidth=0,
                          text="Stop the tunnel",
                          anchor=Tkinter.W,
                          command=proksica.stop)

    url = Tkinter.Button(root,
                         name="tunnel",
                         bg="white",
                         fg="#2B0000",
                         activebackground="#EEEAEA",
                         font="-weight bold",
                         highlightthickness=1,
                         relief=Tkinter.FLAT,
                         borderwidth=0,
                         textvariable=label_text,
                         anchor=Tkinter.W,
                         command=proksica.play)

    log = Tkinter.Label(root,
                        name="log",
                        bg="#EEEAEA",
                        fg="#826969",
                        textvariable=log_text,
                        padx=16,
                        anchor=Tkinter.W)

    jessica = Tkinter.Label(root,
                            name="jessica",
                            anchor=Tkinter.W,
                            borderwidth=0,
                            image=photo)
    jessica.grid(row=0,
                 column=0,
                 columnspan=2)

    url.grid(row=1,
             column=0,
             columnspan=2,
             sticky=Tkinter.W + Tkinter.E)

    log.grid(row=2,
             columnspan=2,
             sticky=Tkinter.W + Tkinter.E)

    root.protocol("WM_DELETE_WINDOW", proksica.close_all)
    root.mainloop()
