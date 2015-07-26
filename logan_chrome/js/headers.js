console.log("Adding onAuthRequired!");
chrome.webRequest.onAuthRequired.addListener(
    function(details, sendCredentials) {
        console.log("onAuthRequired:" + details + sendCredentials);
        sendCredentials({
            authCredentials: {username: "username", password: "password"}
        });
    },
    {urls: ["<all_urls>"]},
    ['asyncBlocking']
);
