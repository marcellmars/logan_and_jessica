go = function() {
    nassh_url = chrome.extension.getUrl("naash/html/nassh.html#tunnel@ssh.pede.rs:443")
    chrome.runtime.sendMessage({"message": nassh_url + "foo bar"}, function(response) {
        console.log(nash_url);
    });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
            go();
    }
);

