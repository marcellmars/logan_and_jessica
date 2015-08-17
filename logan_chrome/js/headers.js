// init variables for ssh tunnel

var userjess = "init";
var passjess = "init";
var realmjess = "init";
var portjess = 8787;
var ssh_tab_id = -1;
var ssh_exists = false;
var proxy_exists = false;

// variables for popup html
var geo_code = "  ";
var geo_country = "";
var status_text = "No tunnel to Jessica. Connected directly...";

var evc = 0;
var tevc = -1;

var setStatus = function() {
    ssh_exists = false;
    proxy_exists = false;
    chrome.tabs.query({},
                    function(tabArray) {
                        tabArray.filter(function(tab,
                                                index,
                                                array) {
                            if (tab.id === ssh_tab_id) {
                                ssh_exists = true;
                            }
                        });

                        chrome.proxy.settings.get({incognito: false},
                                                    function(details) {
                                                        if (details.value.mode === "system") {
                                                            if (ssh_exists === true) {
                                                                status_text = "Tunnel to Jessica established but not in use. Connected directly...";
                                                                chrome.browserAction.setBadgeBackgroundColor({color: [253, 128, 68, 128]});
                                                                chrome.browserAction.setBadgeText({text: geo_code});
                                                            }
                                                            else {
                                                                status_text = "No tunnel to Jessica. Connected directly...";
                                                                chrome.browserAction.setBadgeText({text: ""});
                                                            }
                                                        } else if (details.value.mode === "fixed_servers") {
                                                            if (ssh_exists === true) {
                                                                status_text = "Tunnel to Jessica set. Connected via Jessica...";
                                                                chrome.browserAction.setBadgeBackgroundColor({color: [145, 196, 55, 128]});
                                                                chrome.browserAction.setBadgeText({text: geo_code});
                                                            }
                                                            else {
                                                                clearProxy();
                                                                status_text = "No tunnel to Jessica. Connected directly...";
                                                                chrome.browserAction.setBadgeText({text: ""});
                                                            }
                                                        }
                                                    });
                    });
};

var promiseTabs = function(options) {
    return new Promise(function(resolve, reject) {
        chrome.tabs.create(options, resolve);
    });
};

var compose = function() {
    evc ++;
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
                              // if (ssh_tab_active() !== true) {
                              if (ssh_exists !== true) {
                                  portjess = port;
                                  promiseTabs({'url': "../html/nassh.html#tunnel@ssh.pede.rs:443",
                                               'pinned': true,
                                               'active': false}).then(function(tab) {
                                                   ssh_tab_id = tab.id;
                                               }).then(function() {
                                                   addProxyAuthorization(username, password);
                                               }).then(function() {
                                                   setProxy();
                                               }).then(function() {
                                                   setTimeout(setStatus, 500);
                                               }).then(function() {});
                              }
                              else if (username !== userjess) {
                                  alert("Please, first close previous tunnel.");
                                  clearProxy();
                                  closeTab();
                                  }
                          }
                          else if (ssh_exists === true) {
                              setProxy();
                              setStatus();
                          }
                          else {
                              chrome.tabs.query({},
                                                function(tabArray) {
                                                    var found_tab = false;
                                                    tabArray.filter(function(tab,
                                                                             index,
                                                                             array) {
                                                        if (tab.url.substr(0, 36) === "https://jessica.memoryoftheworld.org") {
                                                            alert("Start tunnel while on tab with Jessica's URL");
                                                            chrome.tabs.update(tab.id, {active: true,
                                                                                        highlighted: true});
                                                            found_tab = true;
                                                        }
                                                    });
                                                    if (found_tab === false) {
                                                        alert("Ask Jessica for a URL to set up a tunnel.");
                                                    }
                                                });
                          };
                      });
};

var direct = function() {
    evc ++;
    clearProxy();
    setStatus();
};

var reset = function() {
    evc ++;
    clearProxy();
    closeTab();
    setStatus();
};

var config = {
    mode: "fixed_servers",
    rules: {
        singleProxy: {
            scheme: "http",
            host: "127.0.0.1",
            port:6666
        },
        bypassList: ["localhost",
                     "127.0.0.1"]
    }
};

var setProxy = function() {
    evc ++;
    chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {});
};

var clearProxy = function() {
    evc ++;
    chrome.proxy.settings.clear(
        {scope: 'regular'},
        function() {});
};

// var getProxy = function() {
//     chrome.proxy.settings.get(
//         {incognito: false},
//         function(details) {
//             console.log(details);
//             proxy = details.value.mode;
//         });
// };

var closeTab = function() {
    evc ++;
    chrome.tabs.query({},
                        function(tabArray) {
                            tabArray.filter(function(tab,
                                                    index,
                                                    array) {
                                if (tab.id === ssh_tab_id) {
                                    chrome.tabs.remove(ssh_tab_id);
                                }
                            });
                        });
};

var authListener = function(details) {
    if (!details.isProxy || details.realm !== realmjess) {
        // console.log("NOT PROXY!");
        return {cancel:true};
    } else {
        // console.log(userjess, passjess);
        return {authCredentials:{username: userjess,
                                 password: passjess}};
    }
};

var addProxyAuthorization = function (user, pass) {
    // console.log("addProxyAuthorization");
    userjess = user;
    passjess = pass;
    realmjess = "Logan & Jessica " + user.substring(0,8);

    chrome.webRequest.onAuthRequired.addListener(authListener,
                                                 {urls:["<all_urls>"]},
                                                 ['blocking']);

};

var tabListener = function() {
    if (tevc !== evc) {
        tevc = evc;
        ssh_exists = false;
        chrome.tabs.query({},
                          function(tabArray) {
                              tabArray.filter(function(tab,
                                                       index,
                                                       array) {
                                  if (tab.id === ssh_tab_id) {
                                      ssh_exists = true;
                                  }
                              });
                          });

        chrome.browserAction.getBadgeText({},
                                          function(t) {
                                              if (t !== "" && ssh_exists === false) {
                                                  chrome.browserAction.setBadgeText({text: ""});
                                              }
                                          });
    };
};

chrome.tabs.onUpdated.addListener(tabListener);
