import Tkinter
from multiprocessing import Process, Pipe
import subprocess
import proxsicag
import random
import datetime
import time

PORT = 9991
PUBLIC_SERVER = "ssh.pede.rs"
PUBLIC_SERVER_PORT = "443"


class Proxsica:
    def __init__(self, ica, root, label_text, log_text):
        self.root = root
        self.label_text = label_text
        self.log_text = log_text
        self.ica = ica
        self.init_states()

    def init_states(self):
        self.play_mode = "tunnel"
        self.last = time.mktime(datetime.datetime.now().timetuple())
        self.ssh_proc, self.url, self.p = [None] * 3

    def play(self):
        if self.play_mode != "tunnel" and self.url:
            self.root.clipboard_clear()
            self.root.clipboard_append(self.url)
            return

        self.portjess = random.randint(1025, 48000)
        self.server = proxsicag.Proxy(self.ica, self.portjess, PORT)
        self.p = Process(target=self.server.start_server)
        self.p.start()

        self.ssh_proc = subprocess.Popen(['ssh', '-T', '-N', '-g', '-C',
                                          '-c', 'arcfour,aes128-cbc,blowfish-cbc',
                                          '-o', 'TCPKeepAlive=yes',
                                          '-o', 'UserKnownHostsFile=/dev/null',
                                          '-o', 'StrictHostKeyChecking=no',
                                          '-o', 'ServerAliveINterval=60',
                                          '-o', 'ExitOnForwardFailure=yes',
                                          '-l', 'tunnel',
                                          '-R', '{}:localhost:{}'.format(self.portjess,
                                                                         PORT),
                                          PUBLIC_SERVER,
                                          '-p', PUBLIC_SERVER_PORT])

        sa = self.server.httpd.socket.getsockname()
        if sa and self.ssh_proc:
            self.play_mode = "copy"
            self.root.nametowidget("stop").grid(row=0, column=1)
            self.label_text.set("Copy Logan's URL")
            # self.label_text.set("Serving HTTP Proxy on {} port {}...\n\
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

        self.root.nametowidget("stop").grid_forget()
        self.label_text.set("Set up a tunnel")
        self.log_text.set("Waiting for Logan...")
        self.init_states()

    def loganica(self):
        n = time.mktime(datetime.datetime.now().timetuple())
        delta = "{:0>8}".format(datetime.timedelta(seconds=(self.last - n) * -1))
        if gan.poll():
            empt = gan.recv()
            self.last = n
            randot = random.randint(4, 40)
            log_text.set("{}Logan is running{}".format(randot * ".",
                                                       (40 - randot) * "."))
        elif log_text.get() != "Waiting for Logan..." and self.play_mode == "copy":
            self.log_text.set("Last Logan's request {} ago.".format(delta))

        log.after(1000, self.loganica)

if __name__ == '__main__':
    root = Tkinter.Tk()
    label_text = Tkinter.StringVar()
    log_text = Tkinter.StringVar()
    label_text.set("Set up a tunnel")
    log_text.set("Waiting for Logan...")

    gan, ica = Pipe()

    proksica = Proxsica(ica, root, label_text, log_text)
    stop = Tkinter.Button(root,
                          name="stop",
                          text="Stop the tunnel",
                          command=proksica.stop)
    url = Tkinter.Button(root,
                         name="url",
                         textvariable=label_text,
                         command=proksica.play)
    log = Tkinter.Label(root,
                        name="log",
                        textvariable=log_text,
                        justify=Tkinter.LEFT,
                        anchor=Tkinter.W)
    url.grid(row=0, column=0)
    log.grid(row=1, columnspan=2, sticky=Tkinter.SW)
    last = time.mktime(datetime.datetime.now().timetuple())
    log.after(2000, proksica.loganica)
    root.mainloop()
