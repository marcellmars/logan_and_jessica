// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

lib.rtdep('lib.f', 'lib.fs',
          'nassh.CommandInstance', 'nassh.GoogleRelay',
          'nassh.PreferenceManager');

/**
 * The NaCl-ssh-powered terminal command.
 *
 * This class defines a command that can be run in an hterm.Terminal instance.
 * This command creates an instance of the NaCl-ssh plugin and uses it to
 * communicate with an ssh daemon.
 *
 * If you want to use something other than this NaCl plugin to connect to a
 * remote host (like a shellinaboxd, etc), you'll want to create a brand new
 * command.
 *
 * @param {Object} argv The argument object passed in from the Terminal.
 */
nassh.CommandInstance = function(argv) {
  // Command arguments.
  this.argv_ = argv;

  // Command environment.
  this.environment_ = argv.environment || {};

  // hterm.Terminal.IO instance.
  this.io = null;

  // Relay manager.
  this.relay_ = null;

  // Parsed extension manifest.
  this.manifest_ = null;

  // The HTML5 persistent FileSystem instance for this extension.
  this.fileSystem_ = null;

  // An HTML5 DirectoryEntry for /.ssh/.
  this.sshDirectoryEntry_ = null;

  // Application ID of auth agent.
  this.authAgentAppID_ = null;

  // Root preference manager.
  this.prefs_ = new nassh.PreferenceManager();

  // Counters used to acknowledge writes from the plugin.
  this.stdoutAcknowledgeCount_ = 0;
  this.stderrAcknowledgeCount_ = 0;

  // Prevent us from reporting an exit twice.
  this.exited_ = false;
};

/**
 * The name of this command used in messages to the user.
 *
 * Perhaps this will also be used by the user to invoke this command if we
 * build a command line shell.
 */
nassh.CommandInstance.prototype.commandName = 'nassh';

/**
 * Static run method invoked by the terminal.
 */
nassh.CommandInstance.run = function(argv) {
  return new nassh.CommandInstance(argv);
};

/**
 * Start the nassh command.
 *
 * Instance run method invoked by the nassh.CommandInstance ctor.
 */
nassh.CommandInstance.prototype.run = function() {
  // Useful for console debugging.
  window.nassh_ = this;

  this.io = this.argv_.io.push();

  // Similar to lib.fs.err, except this logs to the terminal too.
  var ferr = function(msg) {
    return function(err) {
      var ary = Array.apply(null, arguments);
      console.error(msg + ': ' + ary.join(', '));

      this.io.println(nassh.msg('UNEXPECTED_ERROR'));
      this.io.println(err);
    }.bind(this);
  }.bind(this);

  this.prefs_.readStorage(function() {
    nassh.loadManifest(onManifestLoaded, ferr('Manifest load failed'));
  });

  var onManifestLoaded = function(manifest) {
    this.manifest_ = manifest;

    // Set default window title.
    this.io.print('\x1b]0;' + this.manifest_.name + ' ' +
                    this.manifest_.version + '\x07');

    this.io.println(
        nassh.msg('WELCOME_VERSION',
                  ['\x1b[1m' + this.manifest_.name + '\x1b[m',
                   '\x1b[1m' + this.manifest_.version + '\x1b[m']));

    if (this.manifest_.name.match(/\(tot\)/)) {
      // If we're a tot version, show how old the hterm deps are.
      var htermAge = Math.round(
          (new Date() -
           new Date(lib.resource.getData('hterm/concat/date'))) / 1000);

      this.io.println(
          'hterm ' + lib.resource.getData('hterm/changelog/version') + ': ' +
          (htermAge / 60).toFixed(2) + ' minutes ago.');
    }

    this.io.println(
        nassh.msg('WELCOME_FAQ', ['\x1b[1mhttp://goo.gl/TK7876\x1b[m']));

    if (hterm.windowType != 'popup') {
      var osx = window.navigator.userAgent.match(/Mac OS X/);
      if (!osx) {
        this.io.println('');
        this.io.println(
            nassh.msg('OPEN_AS_WINDOW_TIP',
                      ['\x1b[1mhttp://goo.gl/TK7876\x1b[m']));
        this.io.println('');
      }
    }

    nassh.getFileSystem(onFileSystemFound, ferr('FileSystem init failed'));
  }.bind(this);

  var onFileSystemFound = function(fileSystem, sshDirectoryEntry) {
    this.fileSystem_ = fileSystem;
    this.sshDirectoryEntry_ = sshDirectoryEntry;

    var argstr = this.argv_.argString;

    // This item is set before we redirect away to login to a relay server.
    // If it's set now, it's the first time we're reloading after the redirect.
    var pendingRelay = window.sessionStorage.getItem('nassh.pendingRelay');
    window.sessionStorage.removeItem('nassh.pendingRelay');

    if (!argstr || (window.sessionStorage.getItem('nassh.promptOnReload') &&
                    !pendingRelay)) {
      // If promptOnReload is set or we haven't gotten the destination
      // as an argument then we need to ask the user for the destination.
      //
      // The promptOnReload session item allows us to remember that we've
      // displayed the dialog, so we can re-display it if the user reloads
      // the page.  (Items in sessionStorage are scoped to the tab, kept
      // between page reloads, and discarded when the tab goes away.)
      window.sessionStorage.setItem('nassh.promptOnReload', 'yes');

      this.promptForDestination_();
    } else {
      if (!this.connectToArgString(argstr)) {
        this.io.println(nassh.msg('BAD_DESTINATION', [this.argv_.argString]));
        this.exit(1);
      }
    }
  }.bind(this);
};

/**
 * This method moved off to be a static method on nassh, but remains here
 * for js console users who expect to find it here.
 */
nassh.CommandInstance.prototype.exportPreferences = function(onComplete) {
  nassh.exportPreferences(onComplete);
};

/**
 * This method moved off to be a static method on nassh, but remains here
 * for js console users who expect to find it here.
 */
nassh.CommandInstance.prototype.importPreferences = function(
    json, opt_onComplete) {
  nassh.importPreferences(json, opt_onComplete);
};

/**
 * Reconnects to host, using the same CommandInstance.
 *
 * @param {string} argstr The connection ArgString
 */
nassh.CommandInstance.prototype.reconnect = function(argstr) {
  // Terminal reset.
  this.io.print('\x1b[!p');

  this.io = this.argv_.io.push();

  this.plugin_.parentNode.removeChild(this.plugin_);
  this.plugin_ = null;

  this.stdoutAcknowledgeCount_ = 0;
  this.stderrAcknowledgeCount_ = 0;

  this.connectToArgString(argstr);
};

/**
 * Removes a file from the HTML5 filesystem.
 *
 * Most likely you want to remove something from the /.ssh/ directory.
 *
 * This command is only here to support unsavory JS console hacks for managing
 * the /.ssh/ directory.
 *
 * @param {string} fullPath The full path to the file to remove.
 */
nassh.CommandInstance.prototype.removeFile = function(fullPath) {
  lib.fs.removeFile(this.fileSystem_.root, '/.ssh/' + identityName);
};

/**
 * Removes a directory from the HTML5 filesystem.
 *
 * Most likely you'll want to remove the entire /.ssh/ directory.
 *
 * This command is only here to support unsavory JS console hacks for managing
 * the /.ssh/ directory.
 *
 * @param {string} fullPath The full path to the file to remove.
 */
nassh.CommandInstance.prototype.removeDirectory = function(fullPath) {
  this.fileSystem_.root.getDirectory(
      fullPath, {},
      function (f) {
        f.removeRecursively(lib.fs.log('Removed: ' + fullPath),
                            lib.fs.err('Error removing' + fullPath));
      },
      lib.fs.log('Error finding: ' + fullPath)
  );
};

/**
 * Remove all known hosts.
 *
 * This command is only here to support unsavory JS console hacks for managing
 * the /.ssh/ directory.
 */
nassh.CommandInstance.prototype.removeAllKnownHosts = function() {
  this.fileSystem_.root.getFile(
      '/.ssh/known_hosts', {create: false},
      function(fileEntry) { fileEntry.remove(function() {}) });
  /*
   * This isn't necessary, but it makes the user interface a little nicer as
   * most people don't realize that "undefined" is what you get from a void
   * javascript function.  Example console output:
   * > term_.command.removeAllKnownHosts()
   * true
   */
  return true;
};

/**
 * Remove a known host by index.
 *
 * This command is only here to support unsavory JS console hacks for managing
 * the /.ssh/ directory.
 *
 * @param {integer} index One-based index of the known host entry to remove.
 */
nassh.CommandInstance.prototype.removeKnownHostByIndex = function(index) {
  var onError = lib.fs.log('Error accessing /.ssh/known_hosts');
  var self = this;

  lib.fs.readFile(
      self.fileSystem_.root, '/.ssh/known_hosts',
      function(contents) {
        var ary = contents.split('\n');
        ary.splice(index - 1, 1);
        lib.fs.overwriteFile(self.fileSystem_.root, '/.ssh/known_hosts',
                             ary.join('\n'),
                             lib.fs.log('done'),
                             onError);
      }, onError);
};

nassh.CommandInstance.prototype.promptForDestination_ = function(opt_default) {
  var connectDialog = this.io.createFrame(
      lib.f.getURL('html/nassh_connect_dialog.html'), null);

  connectDialog.onMessage = function(event) {
    event.data.argv.unshift(connectDialog);
    this.dispatchMessage_('connect-dialog', this.onConnectDialog_, event.data);
  }.bind(this);

  connectDialog.show();
};

nassh.CommandInstance.prototype.connectToArgString = function(argstr) {
  var ary = argstr.match(/^profile-id:([a-z0-9]+)(\?.*)?/i);
  var rv;
  if (ary) {
    rv = this.connectToProfile(ary[1], ary[2]);
  } else {
    rv = this.connectToDestination(argstr);
  }

  return rv;
};

/**
 * Initiate a connection to a remote host given a profile id.
 */
nassh.CommandInstance.prototype.connectToProfile = function(
    profileID, querystr) {

  var onReadStorage = function() {
    // TODO(rginda): Soft fail on unknown profileID.
    var prefs = this.prefs_.getProfile(profileID);

    // We have to set the url here rather than in connectToArgString, because
    // some callers will come directly to connectToProfile.
    document.location.hash = 'profile-id:' + profileID;

    document.title = prefs.get('description') + ' - ' +
      this.manifest_.name + ' ' + this.manifest_.version;

    this.connectTo({
      username: prefs.get('username'),
      hostname: prefs.get('hostname'),
      port: prefs.get('port'),
      relayOptions: prefs.get('relay-options'),
      identity: prefs.get('identity'),
      argstr: prefs.get('argstr'),
      terminalProfile: prefs.get('terminal-profile'),
      authAgentAppID: prefs.get('auth-agent-appid')
    });
  }.bind(this);

  // Re-read prefs from storage in case they were just changed in the connect
  // dialog.
  this.prefs_.readStorage(onReadStorage);

  return true;
};

/**
 * Initiate a connection to a remote host given a destination string.
 *
 * @param {string} destination A string of the form username@host[:port].
 * @return {boolean} True if we were able to parse the destination string,
 *     false otherwise.
 */
nassh.CommandInstance.prototype.connectToDestination = function(destination) {
  if (destination == 'crosh') {
    document.location = 'crosh.html'
    return true;
  }

  var ary = destination.match(
      /^([^@]+)@([^:@]+)(?::(\d+))?(?:@([^:]+)(?::(\d+))?)?$/);

  if (!ary)
    return false;

  // We have to set the url here rather than in connectToArgString, because
  // some callers may come directly to connectToDestination.
  document.location.hash = destination;

  var relayOptions = '';
  if (ary[4]) {
    relayOptions = '--proxy-host=' + ary[4];

    if (ary[5])
      relayOptions += ' --proxy-port=' + ary[5];
  }

  return this.connectTo({
      username: ary[1],
      hostname: ary[2],
      port: ary[3],
      //argstr: "-N -D 6666",
      relayOptions: relayOptions
  });
};

/**
 * Initiate a connection to a remote host.
 *
 * @param {string} username The username to provide.
 * @param {string} hostname The hostname or IP address to connect to.
 * @param {string|integer} opt_port The optional port number to connect to.
 * @return {boolean} False if there was some trouble with the parameters, true
 *     otherwise.
 */
nassh.CommandInstance.prototype.connectTo = function(params) {
  if (!(params.username && params.hostname))
    return false;

  if (params.hostname == '>crosh') {
    // TODO: This will need to be done better.  document.location changes don't
    // work in v2 apps.
    document.location = 'crosh.html';
    return;
  }

  if (params.relayOptions) {
    var relay = new nassh.GoogleRelay(this.io, params.relayOptions);

    // TODO(rginda): The `if (relay.proxyHost)` test is part of a goofy hack
    // to add the --ssh-agent param to the relay-options pref.  --ssh-agent has
    // no business being a relay option, but it's the best of the bad options.
    // In the future perfect world, 'relay-options' would probably be a generic
    // 'nassh-options' value and the parsing code wouldn't be part of the relay
    // class.
    //
    // For now, we let the relay code parse the options, and if the resulting
    // options don't include a proxyHost then we don't have an actual relay.
    // We may have a --ssh-agent argument though, which we'll pull out of
    // the relay object later.
    if (relay.proxyHost) {
      this.relay_ = relay;

      this.io.println(nassh.msg(
          'INITIALIZING_RELAY',
          [this.relay_.proxyHost + ':' + this.relay_.proxyPort]));

      if (!this.relay_.init()) {
        // A false return value means we have to redirect to complete
        // initialization.  Bail out of the connect for now.  We'll resume it
        // when the relay is done with its redirect.

        // If we're going to have to redirect for the relay then we should make
        // sure not to re-prompt for the destination when we return.
        sessionStorage.setItem('nassh.pendingRelay', 'yes');
        this.relay_.redirect();
        return true;
      }
    }

    if (relay.options['--ssh-agent'])
      params.authAgentAppID = relay.options['--ssh-agent'];
  }

  this.authAgentAppID_ = params.authAgentAppID;

  this.io.setTerminalProfile(params.terminalProfile || 'default');

  // TODO(rginda): The "port" parameter was removed from the CONNECTING message
  // on May 9, 2012, however the translations haven't caught up yet.  We should
  // remove the port parameter here once they do.
  this.io.println(nassh.msg('CONNECTING',
                            [params.username + '@' + params.hostname,
                             (params.port || '??')]));
  this.io.onVTKeystroke = this.sendString_.bind(this);
  this.io.sendString = this.sendString_.bind(this);
  this.io.onTerminalResize = this.onTerminalResize_.bind(this);

  var argv = {};
  argv.terminalWidth = this.io.terminal_.screenSize.width;
  argv.terminalHeight = this.io.terminal_.screenSize.height;
  argv.useJsSocket = !!this.relay_;
  argv.environment = this.environment_;
  argv.writeWindow = 8 * 1024;

  argv.arguments = ['-C'];  // enable compression

  if (params.authAgentAppID) {
    argv.authAgentAppID = params.authAgentAppID;
    argv.arguments.push('-A');  // Force agent forwarding.
  }

  // Disable IP address check for connection through proxy.
  if (argv.useJsSocket)
    argv.arguments.push("-o CheckHostIP=no");

  if (params.argstr) {
      var ary = params.argstr.match(/^(.*?)(?:(?:^|\s+)(?:--\s+(.*)))?$/);
    if (ary) {
      if (ary[1])
        argv.arguments = argv.arguments.concat(ary[1].trim().split(/\s+/));
      if (ary[2])
        commandArgs = ary[2].trim();
    }
  }

  if (params.identity)
    argv.arguments.push('-i/.ssh/' + params.identity);
  if (params.port)
    argv.arguments.push('-p ' + params.port);

  argv.arguments.push(params.username + '@' + params.hostname);
  argv.arguments.push('-v');
  argv.arguments.push("-o StrictHostKeyChecking=no");
  argv.arguments.push('-N');
  // argv.arguments.push('-L 6666:ssh.pede.rs:' + chrome.extension.getBackgroundPage().portjess);
  argv.arguments.push('-L 6666:' + params.hostname + ':' + chrome.extension.getBackgroundPage().portjess);

  console.log(argv)

   // if (commandArgs)
   //    argv.arguments.push(commandArgs);

  var self = this;
  this.initPlugin_(function() {
      if (!nassh.v2)
        window.onbeforeunload = self.onBeforeUnload_.bind(self);

      self.sendToPlugin_('startSession', [argv]);
    });

  document.querySelector('#terminal').focus();

  return true;
};

/**
 * Dispatch a "message" to one of a collection of message handlers.
 */
nassh.CommandInstance.prototype.dispatchMessage_ = function(
    desc, handlers, msg) {
  if (msg.name in handlers) {
    handlers[msg.name].apply(this, msg.argv);
  } else {
    console.log('Unknown "' + desc + '" message: ' + msg.name);
  }
};

nassh.CommandInstance.prototype.initPlugin_ = function(onComplete) {
  var self = this;
  function onPluginLoaded() {
    self.io.println(nassh.msg('PLUGIN_LOADING_COMPLETE'));
    onComplete();
  };

  this.io.print(nassh.msg('PLUGIN_LOADING'));

  this.plugin_ = window.document.createElement('embed');
  this.plugin_.style.cssText =
      ('position: absolute;' +
       'top: -99px' +
       'width: 0;' +
       'height: 0;');

  var pluginURL = '../plugin/pnacl/ssh_client.nmf';

  this.plugin_.setAttribute('src', pluginURL);
  this.plugin_.setAttribute('type', 'application/x-nacl');
  this.plugin_.addEventListener('load', onPluginLoaded);
  this.plugin_.addEventListener('message', this.onPluginMessage_.bind(this));
  this.plugin_.addEventListener('crash', function (ev) {
    console.log('plugin crashed');
    self.exit(-1);
  });

  document.body.insertBefore(this.plugin_, document.body.firstChild);
};

/**
 * Send a message to the nassh plugin.
 *
 * @param {string} name The name of the message to send.
 * @param {Array} arguments The message arguments.
 */
nassh.CommandInstance.prototype.sendToPlugin_ = function(name, args) {
  var str = JSON.stringify({name: name, arguments: args});

  this.plugin_.postMessage(str);
};

/**
 * Send a string to the remote host.
 *
 * @param {string} string The string to send.
 */
nassh.CommandInstance.prototype.sendString_ = function(string) {
  this.sendToPlugin_('onRead', [0, btoa(string)]);
};

/**
 * Notify plugin about new terminal size.
 *
 * @param {string|integer} terminal width.
 * @param {string|integer} terminal height.
 */
nassh.CommandInstance.prototype.onTerminalResize_ = function(width, height) {
  this.sendToPlugin_('onResize', [Number(width), Number(height)]);
};

/**
 * Exit the nassh command.
 */
nassh.CommandInstance.prototype.exit = function(code) {
  if (!nassh.v2)
    window.onbeforeunload = null;

  this.io.println(nassh.msg('DISCONNECT_MESSAGE', [code]));
  this.io.println(nassh.msg('RECONNECT_MESSAGE'));
  this.io.onVTKeystroke = function(string) {
    var ch = string.toLowerCase();
    if (ch == 'r' || ch == ' ' || ch == '\x0d' /* enter */)
      this.reconnect(document.location.hash.substr(1));

    if (ch == 'c' || ch == '\x12' /* ctrl-r */) {
      nassh.reloadWindow();
      return;
    }

    if (ch == 'e' || ch == 'x' || ch == '\x1b' /* ESC */ ||
        ch == '\x17' /* C-w */) {
      if (this.exited_)
        return;

      this.exited_ = true;
      this.io.pop();
      if (this.argv_.onExit)
        this.argv_.onExit(code);
    }
  }.bind(this);
};

nassh.CommandInstance.prototype.onBeforeUnload_ = function(e) {
  if (hterm.windowType == 'popup')
    return;

  var msg = nassh.msg('BEFORE_UNLOAD');
  e.returnValue = msg;
  return msg;
};

/**
 * Called when the plugin sends us a message.
 *
 * Plugin messages are JSON strings rather than arbitrary JS values.  They
 * also use "arguments" instead of "argv".  This function translates the
 * plugin message into something dispatchMessage_ can digest.
 */
nassh.CommandInstance.prototype.onPluginMessage_ = function(e) {
  var msg = JSON.parse(e.data);
  msg.argv = msg.arguments;
  this.dispatchMessage_('plugin', this.onPlugin_, msg);
};

/**
 * Connect dialog message handlers.
 */
nassh.CommandInstance.prototype.onConnectDialog_ = {};

/**
 * Sent from the dialog when the user chooses a profile.
 */
nassh.CommandInstance.prototype.onConnectDialog_.connectToProfile = function(
    dialogFrame, profileID) {
  dialogFrame.close();

  if (!this.connectToProfile(profileID))
    this.promptForDestination_();
};

/**
 * Plugin message handlers.
 */
nassh.CommandInstance.prototype.onPlugin_ = {};

/**
 * Log a message from the plugin.
 */
nassh.CommandInstance.prototype.onPlugin_.printLog = function(str) {
  console.log('plugin log: ' + str);
};

/**
 * Plugin has exited.
 */
nassh.CommandInstance.prototype.onPlugin_.exit = function(code) {
  console.log('plugin exit: ' + code);
  this.sendToPlugin_('onExitAcknowledge', []);
  this.exit(code);
};

/**
 * Plugin wants to open a file.
 *
 * The plugin leans on JS to provide a persistent filesystem, which we do via
 * the HTML5 Filesystem API.
 *
 * In the future, the plugin may handle its own files.
 */
nassh.CommandInstance.prototype.onPlugin_.openFile = function(fd, path, mode) {
  var self = this;
  function onOpen(success) {
    self.sendToPlugin_('onOpenFile', [fd, success]);
  }

  if (path == '/dev/random') {
    var streamClass = nassh.Stream.Random;
    var stream = nassh.Stream.openStream(streamClass, fd, path, onOpen);
    stream.onClose = function(reason) {
      self.sendToPlugin_('onClose', [fd, reason]);
    };
  } else {
    self.sendToPlugin_('onOpenFile', [fd, false]);
  }
};

nassh.CommandInstance.prototype.onPlugin_.openSocket = function(
    fd, host, port) {
  var self = this;
  var stream = null;

  if (port == 0 && host == this.authAgentAppID_) {
    // Request for auth-agent connection.
    stream = nassh.Stream.openStream(nassh.Stream.SSHAgentRelay,
        fd, {authAgentAppID: this.authAgentAppID_},
        function onOpen(success) {
          self.sendToPlugin_('onOpenSocket', [fd, success]);
        });
  } else {
    // Regular relay connection request.
    if (!this.relay_) {
      this.sendToPlugin_('onOpenSocket', [fd, false]);
      return;
    }

    stream = this.relay_.openSocket(
        fd, host, port,
        function onOpen(success) {
          self.sendToPlugin_('onOpenSocket', [fd, success]);
        });
  }

  stream.onDataAvailable = function(data) {
    self.sendToPlugin_('onRead', [fd, data]);
  };

  stream.onClose = function(reason) {
    console.log('close: ' + fd);
    self.sendToPlugin_('onClose', [fd, reason]);
  };
};

/**
 * Plugin wants to write some data to a file descriptor.
 *
 * This is used to write to HTML5 Filesystem files.
 */
nassh.CommandInstance.prototype.onPlugin_.write = function(fd, data) {
  var self = this;

  if (fd == 1 || fd == 2) {
    var string = atob(data);
    var ackCount = (fd == 1 ?
                    this.stdoutAcknowledgeCount_ += string.length :
                    this.stderrAcknowledgeCount_ += string.length);
    this.io.writeUTF8(string);

    setTimeout(function() {
        self.sendToPlugin_('onWriteAcknowledge', [fd, ackCount]);
      }, 0);
    return;
  }

  var stream = nassh.Stream.getStreamByFd(fd);
  if (!stream) {
    console.warn('Attempt to write to unknown fd: ' + fd);
    return;
  }

  stream.asyncWrite(data, function(writeCount) {
      self.sendToPlugin_('onWriteAcknowledge', [fd, writeCount]);
    }, 100);
};

/**
 * Plugin wants to read from a fd.
 */
nassh.CommandInstance.prototype.onPlugin_.read = function(fd, size) {
  var self = this;
  var stream = nassh.Stream.getStreamByFd(fd);

  if (!stream) {
    if (fd)
      console.warn('Attempt to read from unknown fd: ' + fd);
    return;
  }

  stream.asyncRead(size, function(b64bytes) {
      self.sendToPlugin_('onRead', [fd, b64bytes]);
    });
};

/**
 * Plugin wants to close a file descriptor.
 */
nassh.CommandInstance.prototype.onPlugin_.close = function(fd) {
  var self = this;
  var stream = nassh.Stream.getStreamByFd(fd);
  if (!stream) {
    console.warn('Attempt to close unknown fd: ' + fd);
    return;
  }

  stream.close();
};
