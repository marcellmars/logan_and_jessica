var userjess = "init";
var passjess = "init";
var realmjess = "init";
var portjess = 8787;
var ssh_tab_id = -1;

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
    chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {});
};

var clearProxy = function() {
    chrome.proxy.settings.clear(
        {scope: 'regular'},
        function() {});
};

var getProxy = function() {
    chrome.proxy.settings.get(
        {incognito: false},
        function(details) {
            console.log(details);
            proxy = details.value.mode;
        });
};

var closeTab = function() {
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
        console.log("NOT PROXY!");
        return {cancel:true};
    } else {
        console.log(userjess, passjess);
        return {authCredentials:{username: userjess,
                                 password: passjess}};
    }
};

var addProxyAuthorization = function (user, pass) {
    console.log("addProxyAuthorization");
    userjess = user;
    passjess = pass;
    realmjess = "Logan & Jessica " + user.substring(0,8);

    chrome.webRequest.onAuthRequired.addListener(authListener,
                                                 {urls:["<all_urls>"]},
                                                 ['blocking']);

};
