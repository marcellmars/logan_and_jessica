import Tkinter
from multiprocessing import Process
import subprocess
import proxsica
import random


class Proxsica:
    def __init__(self, root, label_text):
        self.root = root
        self.label_text = label_text
        self.ssh_proc = None

    def play(self):
        print("ha!")
        # self.root.event_generate("<<my_event>>")
        self.server = proxsica.Proxy()
        self.portjess = random.randint(1025, 48000)
        self.p = Process(target=self.server.start_server)
        self.p.start()
        self.ssh_proc = subprocess.Popen(['ssh', '-T', '-N', '-g', '-C',
                                          '-c', 'arcfour,aes128-cbc,blowfish-cbc',
                                          '-o', 'TCPKeepAlive=yes',
                                          '-o', 'UserKnownHostsFile=/dev/null',
                                          '-o', 'StrictHostKeyChecking=no',
                                          '-o', 'ServerAliveINterval=60',
                                          '-o', 'ExitOnForwardFailure=yes',
                                          # '-v',
                                          '-l', 'tunnel',
                                          '-R', '{}:localhost:{}'.format(self.portjess,
                                                                         9991),
                                          'ssh.pede.rs',
                                          # 'memoryoftheworld.org',
                                          '-p', '443'])
        print("tiker: {} and 9991".format(self.portjess))
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


# def change_label(event):
#     print(event.__dict__)
#     label['text'] = root.label_text
#     from pprint import pprint as pp
#     pp([(k, root[k]) for k in root.keys()])
#     pp([(k, label[k]) for k in label.keys()])
#     pp([(k, play[k]) for k in play.keys()])

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
    # root.bind("<<my_event>>", change_label)
    root.mainloop()
