import Tkinter
from multiprocessing import Process
import subprocess
import proxsicag
import random

PORT = 9991


class Proxsica:
    def __init__(self, root, label_text):
        self.root = root
        self.label_text = label_text
        self.ssh_proc = None

    def play(self):
        self.portjess = random.randint(1025, 48000)
        self.server = proxsicag.Proxy(self.portjess, PORT)
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
                                          'ssh.pede.rs',
                                          '-p', '443'])
        self.label_text.set("SSH Started")

    def stop(self):
        if self.ssh_proc:
            self.label_text.set("SSH stopped...")
            self.ssh_proc.kill()
            self.ssh_proc = None
        if self.p:
            self.p.terminate()
            self.p.join()
            self.server.stop_server()
            self.p = None
            self.label_text.set("SSH stopped\nProxy stopped...")
        else:
            self.label_text.set("Start the server first...")

if __name__ == '__main__':
    root = Tkinter.Tk()
    label_text = Tkinter.StringVar()
    proksica = Proxsica(root, label_text)
    play = Tkinter.Button(root, text="Play", command=proksica.play)
    stop = Tkinter.Button(root, text="Stop", command=proksica.stop)
    label = Tkinter.Label(root, textvariable=label_text, wraplength=80)
    play.grid(row=0, column=0)
    stop.grid(row=1, column=0)
    label.grid(row=0, column=1, rowspan=2)
    root.mainloop()
