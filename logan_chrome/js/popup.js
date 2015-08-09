var bp = chrome.extension.getBackgroundPage();

getArgs = function() {
    chrome.tabs.query({active:true,currentWindow:true},function(tabArray){
        tab = tabArray[0]
        url = tab.url;
    });

    args = url.split("/");
    userpass = args[args.length -1].split(":");
    port = args[args.length - 2];
    username = userpass[0]
    password = userpass[1];
    bp.userjess = username;
    bp.passjess = password;
    bp.portjess = port;
    bp.realmjess = "Logan & Jessica " + username.substring(0,8);
    //bp.addProxyAuthorization(username, password)

    pp = document.getElementById("popup")
    pp.innerHTML = "";
    pp.appendChild(document.createTextNode("Jessica invited you to run together..."));
    pp.appendChild(document.createElement("br"));

    pp.appendChild(document.createTextNode("username: " + username));
    pp.appendChild(document.createElement("br"));
    pp.appendChild(document.createTextNode("password: " + password));
    pp.appendChild(document.createElement("br"));

    pp.appendChild(document.createTextNode("port: " + port))
    pp.appendChild(document.createElement("br"));
    pp.appendChild(document.createElement("br"));
    pp.innerHTML += "<a href='../html/nassh.html#tunnel@ssh.pede.rs:443' target='_blank'>RUN</a>"
    pp.appendChild(document.createElement("br"));
}

compose = function() {
    chrome.tabs.query({active:true,currentWindow:true},function(tabArray){
        tab = tabArray[0]
        url = tab.url;
    });

    args = url.split("/");
    userpass = args[args.length -1].split(":");
    port = args[args.length - 2];
    username = userpass[0]
    password = userpass[1];
    bp.portjess = port;
    //bp.userjess = username;
    //bp.passjess = password;
    chrome.tabs.create({'url': "../html/nassh.html#tunnel@ssh.pede.rs:443", 'pinned': true}, function(tab){});
    //bp.addProxyAuthorization(username, password);
    bp.addProxyAuthorization(username, password);
    bp.setProxy();
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("parse").addEventListener("click", getArgs);
    document.getElementById("parse").click();
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("setproxy").addEventListener("click", bp.setProxy);
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("clearproxy").addEventListener("click", bp.clearProxy);
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("getproxy").addEventListener("click", bp.getProxy);
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("runall").addEventListener("click", compose);
});
