getArgs = function() {
    chrome.tabs.query({active:true,currentWindow:true},function(tabArray){
        url = tabArray[0].url;
    });
    args = url.split("/");
    username = args[args.length - 1];
    port = args[args.length - 2];
    pp = document.getElementById("popup")
    pp.innerHTML = "";
    pp.appendChild(document.createTextNode("Jessica invited you to run together..."));
    pp.appendChild(document.createElement("br"));
    pp.appendChild(document.createTextNode("username: " + username));
    pp.appendChild(document.createElement("br"));
    pp.appendChild(document.createTextNode("port: " + port))
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("button").addEventListener("click", getArgs);
    document.getElementById("button").click();
});
