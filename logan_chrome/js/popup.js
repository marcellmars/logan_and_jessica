var bp = chrome.extension.getBackgroundPage();
var ssh_exists = false;
var proxy_exists = false;

var setFlags = function(geoip) {
    var loc = document.createElement("div");
    var flg = document.createElement("span");
    loc.setAttribute('class', 'tlag');
    flg.setAttribute('class', 'flag ' + 'flag-' + geoip.country_code.toLocaleLowerCase());

    var txt = document.createTextNode("Current location: " + geoip.country + "  ");
    loc.appendChild(txt);
    loc.appendChild(flg);
    document.body.appendChild(loc);
};

var setStatus = function() {
    var script = document.createElement('script');
    script.src = 'https://www.telize.com/geoip?callback=setFlags';
    document.body.appendChild(script);
    document.body.removeChild(script);

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
                                                                document.getElementById("status").innerText = "No tunnel to Jessica. Connected directly...";
                                                            }
                                                        }
                                                    });
                    });
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
                                  setTimeout(2000, setStatus);
                              }
                              else if (username !== bp.userjess) {
                                  alert("Please, first close previous tunnel.");
                                  bp.clearProxy();
                                  bp.closeTab();
                                  }
                          }
                          else if (ssh_exists === true) {
                              bp.setProxy();
                              setStatus();
                          }
                      });
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

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("viajessica").addEventListener("click", compose);
    setStatus();
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("direct").addEventListener("click", direct);
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("reset").addEventListener("click", reset);
});
