var userjess = "init";
var passjess = "init";
var realmjess = "init";
var portjess = 8787;

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

var foobar = function() {
    console.log("foobar!")
}

setProxy = function() {
    chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {});
}

clearProxy = function() {
    chrome.proxy.settings.clear(
        {scope: 'regular'},
        function() {});
}

getProxy = function() {
    chrome.proxy.settings.get(
        {incognito: false},
        function(details) {
            console.log(details);
        });
}

var authListener = function(details) {
    if (!details.isProxy || details.realm !== realmjess) {
        console.log("NOT PROXY!")
        return {cancel:true};
    } else {
        console.log(userjess, passjess)
        return {authCredentials:{username: userjess,
                                 password: passjess}}
    }
}

addProxyAuthorization = function (user, pass) {
    console.log("addProxyAuthorization")
    userjess = user;
    passjess = pass;
    realmjess = "Logan & Jessica " + user.substring(0,8);

    chrome.webRequest.onAuthRequired.addListener(authListener,
                                                 {urls:["<all_urls>"]},
                                                 ['blocking']);

}
