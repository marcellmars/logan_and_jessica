var bp = chrome.extension.getBackgroundPage();
var ssh_exists = false;
var proxy_exists = false;

var setStatus = function() {
    ssh_exists = false;
    proxy_exists = false;
    chrome.tabs.query({},
                    function(tabArray) {
                        tabArray.filter(function(tab,
                                                index,
                                                array) {
                            if (tab.id === bp.ssh_tab_id) {
                                ssh_exists = true;
                            }
                        });

                        chrome.proxy.settings.get({incognito: false},
                                                    function(details) {
                                                        if (details.value.mode === "system") {
                                                            if (ssh_exists === true) {
                                                                document.getElementById("status").innerText = "Tunnel to Jessica established but not in use. Connected directly...";
                                                            }
                                                            else {
                                                                document.getElementById("status").innerText = "No tunnel to Jessica. Connected directrly...";
                                                            }
                                                        } else if (details.value.mode === "fixed_servers") {
                                                            if (ssh_exists === true) {
                                                                document.getElementById("status").innerText = "Tunnel to Jessica set. Connected via Jessica...";
                                                            }
                                                            else {
                                                                bp.clearProxy();
                                                                document.getElementById("status").innerText = "No tunnel to Jessica. Connected directrly...";
                                                            }
                                                        }
                                                    });
                    });
};


var getArgs = function() {
    setStatus();
    chrome.tabs.query({active:true,
                       currentWindow:true},
                      function(tabArray) {
                          // tab = tabArray[0];
                          // url = tab.url;
                      });

    // args = url.split("/");
    // userpass = args[args.length -1].split(":");
    // port = args[args.length - 2];
    // username = userpass[0];
    // password = userpass[1];
    // bp.userjess = username;
    // bp.passjess = password;
    // bp.portjess = port;
    // bp.realmjess = "Logan & Jessica " + username.substring(0,8);
    // //bp.addProxyAuthorization(username, password)

    // pp = document.getElementById("popup");
    // pp.innerHTML = "";
    // pp.appendChild(document.createTextNode("Jessica invited you to run together..."));
    // pp.appendChild(document.createElement("br"));

    // pp.appendChild(document.createTextNode("username: " + username));
    // pp.appendChild(document.createElement("br"));
    // pp.appendChild(document.createTextNode("password: " + password));
    // pp.appendChild(document.createElement("br"));

    // pp.appendChild(document.createTextNode("port: " + port));
    // pp.appendChild(document.createElement("br"));
    // pp.appendChild(document.createElement("br"));
    // pp.innerHTML += "<a href='../html/nassh.html#tunnel@ssh.pede.rs:443' target='_blank'>RUN</a>";
    // pp.appendChild(document.createElement("br"));
};


var compose = function() {
    setStatus();
    chrome.tabs.query({highlighted:true,
                       currentWindow:true},
                      function(tabArray) {
                          var tab = tabArray[0];
                          if (tab.url.substr(0, 36) === "https://jessica.memoryoftheworld.org") {
                              var url = tab.url;
                              var args = url.split("/");
                              var userpass = args[args.length -1].split(":");
                              var port = args[args.length - 2];
                              var username = userpass[0];
                              var password = userpass[1];
                              // if (bp.ssh_tab_active() !== true) {
                              if (ssh_exists !== true) {
                                  bp.portjess = port;
                                  bp.addProxyAuthorization(username, password);
                                  bp.setProxy();
                                  chrome.tabs.create({'url': "../html/nassh.html#tunnel@ssh.pede.rs:443",
                                                      'pinned': true},
                                                     function(tab) {
                                                         bp.ssh_tab_id = tab.id;
                                                     });
                              }
                              else if (username !== bp.userjess) {
                                  alert("Please, first close previous tunnel.");
                                  bp.clearProxy();
                                  bp.closeTab();
                                  }
                          }
                          else if (ssh_exists === true) {
                              bp.setProxy();
                          }
                      });
    setTimeout(2000, setStatus);
};

var direct = function() {
    bp.clearProxy();
    setStatus();
};

var reset = function() {
    bp.clearProxy();
    bp.closeTab();
    setStatus();
};

// document.addEventListener("DOMContentLoaded", function() {
//     document.getElementById("parse").addEventListener("click", getArgs);
//     document.getElementById("parse").click();
// });

// document.addEventListener("DOMContentLoaded", function() {
//     document.getElementById("setproxy").addEventListener("click", bp.setProxy);
// });

// document.addEventListener("DOMContentLoaded", function() {
//     document.getElementById("clearproxy").addEventListener("click", bp.clearProxy);
// });

// document.addEventListener("DOMContentLoaded", function() {
//     document.getElementById("getproxy").addEventListener("click", bp.getProxy);
// });

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("viajessica").addEventListener("click", compose);
    // getArgs();
    setStatus();
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("direct").addEventListener("click", direct);
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("reset").addEventListener("click", reset);
});
