// init variables for ssh tunnel
var public_server = "";
var public_server_port = "";
var public_server_user = "";
var public_server_password = "";

var userjess = "init";
var passjess = "init";
var realmjess = "init";
var portjess = 8787;
var ssh_tab_id = -1;
var ssh_exists = false;

// variables for popup html
var geo_code = "  ";
var geo_country = "";
var status_text = "No tunnel to Jessica. Connected directly...";

var evc = 0;
var tevc = -1;

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

var getJSON = function(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.responseType = 'json';
        xhr.onload = function() {
            var status = xhr.status;
            if (status == 200) {
                resolve(xhr.response);
            } else {
                reject(status);
            }
        };
        xhr.send();
    });
};

var promiseCreateTabs = function(options) {
    return new Promise(function(resolve, reject) {
        chrome.tabs.create(options, resolve);
    });
};

var promiseClearProxy = function(options) {
    return new Promise(function(resolve, reject) {
        chrome.proxy.settings.clear(options, resolve);
    });
};

var promiseSetProxy = function(options) {
    return new Promise(function(resolve, reject) {
        chrome.proxy.settings.set(options, resolve);
    });
};

var promiseTabsQuery = function(options) {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query(options, resolve);
    });
};

var promiseGetBadgeText = function(options) {
    return new Promise(function(resolve, reject) {
        chrome.browserAction.getBadgeText(options, resolve);
    });
};

var setFlag = function() {
    getJSON("https://www.telize.com/geoip")
        .then(
            function(geoip) {
                if (geoip.country_code !== "") {
                    geo_code = geoip.country_code.toUpperCase();
                    chrome.browserAction.setBadgeText({text: geo_code});
                }
            }
        );

    if (ssh_exists === true && (geo_code === "  " || geo_code === "")) {
        setTimeout(setFlag, 5000);
    }
};

var compose = function() {
    // setStatus();
    promiseTabsQuery({})
        .then(
            function(tabArray) {
                var ssh_e = false;
                tabArray.filter(function(tab,
                                         index,
                                         array) {
                    if (tab.id === ssh_tab_id) {
                        ssh_e = true;
                    }
                });
                ssh_exists = ssh_e;
            })
        .then(
            promiseTabsQuery({highlighted:true,
                              currentWindow:true})
                .then(
                    function(tabArray) {
                        var tab = tabArray[0];
                        if (tab.url.substr(0, 36) === "https://jessica.memoryoftheworld.org") {
                            var url = tab.url;
                            var args = url.split("/");
                            var userpass = args[args.length -1].split(":");
                            var port = args[args.length - 2];
                            var public_server = args[args.length -3];
                            var public_server_port = args[args.length -4];
                            var public_server_user = args[args.length -5];
                            var public_server_password = args[args.length -6];
                            var username = userpass[0];
                            var password = userpass[1];

                            if (username !== userjess && ssh_exists === true) {
                                alert("Please, first close previous tunnel.");
                                reset();
                            }
                            else if (ssh_exists === true) {
                                setProxy();
                            }
                            else {
                                portjess = port;
                                url =  "../html/nassh.html#" + public_server_user + "@" + public_server + ":" + public_server_port;
                                promiseCreateTabs({'url': url,
                                                   'pinned': true,
                                                   'active': false})
                                    .then(
                                        function(tab) {
                                            ssh_tab_id = tab.id;
                                        })
                                    .then(
                                        function() {
                                            addProxyAuthorization(username, password);
                                        })
                                    .then(
                                        function() {
                                            setProxy();
                                        })
                                    .then(
                                        function() {
                                            setFlag();
                                        })
                                    .then(
                                        function() {});
                            }
                        }
                        else if (ssh_exists === true) {
                            setProxy();
                        }
                        else {
                            chrome.tabs.query({},
                                              function(tabArray) {
                                                  var found_tab = false;
                                                  tabArray.filter(function(tab,
                                                                           index,
                                                                           array) {
                                                      if (tab.url.substr(0, 36) === "https://jessica.memoryoftheworld.org") {
                                                          alert("You should start a tunnel while the page with Jessica's URL is selected. That tab will be selected automatically after you confirm this message.\n\nPlease, use your Logan's extension while on Jessica's URL page.");
                                                          chrome.tabs.update(tab.id,
                                                                             {active: true,
                                                                              highlighted: true});
                                                          found_tab = true;
                                                      }
                                                  });
                                                  if (found_tab === false) {
                                                      alert("To set up a tunnel and surf via Jessica you should have an URL from Jessica. You should start your tunnel while the tab in which you opened Jessica'a URL is active and selected.\n\nPlease, ask Jessica to send her URL to you.");
                                                  }
                                              });
                        };
                    }
                ))
        .then(function() {});
    evc ++;
};

var reset = function() {
    promiseClearProxy({scope: 'regular'})
        .then(
            promiseTabsQuery({})
                .then(
                  function(tabArray) {
                      tabArray.filter(function(tab,
                                               index,
                                               array) {
                          if (tab.id === ssh_tab_id) {
                              chrome.tabs.remove(ssh_tab_id);
                          }
                      });
                  })
                .then(function() {})
        )
        .then(
            function() {
                // setStatus();
                status_text = "No tunnel to Jessica. Connected directly...";
                chrome.browserAction.setBadgeText({text: ""});
        })
        .then(
            function() {});
    evc ++;
};

var setProxy = function() {
    promiseSetProxy(
        {value: config, scope: 'regular'})
        .then(
            function() {
                // setStatus();
                status_text = "Tunnel to Jessica set. Connected via Jessica...";
                chrome.browserAction.setBadgeBackgroundColor({color: [145, 196, 55, 128]});
                chrome.browserAction.setBadgeText({text: geo_code});
            }
        )
        .then(function() {
            setFlag();
        })
        .then(function() {});
    evc ++;
};

var clearProxy = function() {
    promiseClearProxy({scope: 'regular'})
        .then(
            function() {
                // setStatus();
                status_text = "Tunnel to Jessica established but not in use. Connected directly...";
                chrome.browserAction.setBadgeBackgroundColor({color: [253, 128, 68, 128]});
                chrome.browserAction.setBadgeText({text: geo_code});
            })
        .then(function() {});
    evc ++;
};

var getProxy = function() {
    chrome.proxy.settings.get(
        {incognito: false},
        function(details) {
            console.log(details);
            proxy = details.value.mode;
        });
};

var authListener = function(details) {
    if (!details.isProxy || details.realm !== realmjess) {
        return {cancel:true};
    } else {
        return {authCredentials:{username: userjess,
                                 password: passjess}};
    }
};

var addProxyAuthorization = function (user, pass) {
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
        promiseTabsQuery({})
            .then(
                function(tabArray) {
                    var ssh_e = false;
                    tabArray.filter(function(tab,
                                             index,
                                             array) {
                        if (tab.id === ssh_tab_id) {
                            ssh_e = true;
                        }
                    });
                    ssh_exists = ssh_e;
                })
            .then(promiseGetBadgeText({})
                  .then(
                      function(t) {
                          if (t !== "" && ssh_exists === false) {
                              status_text = "No tunnel to Jessica. Connected directly...";
                              chrome.browserAction.setBadgeText({text: ""});
                          }
                      }))
            .then(function() {});
    };
};

chrome.tabs.onUpdated.addListener(tabListener);
chrome.tabs.onRemoved.addListener(tabListener);
