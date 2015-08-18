var bp = chrome.extension.getBackgroundPage();
var evc = -1;

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

var setFlags = function() {
    getJSON("https://www.telize.com/geoip").then(
        function(geoip) {
            if (geoip.country_code !== ""){
                bp.geo_code = geoip.country_code.toUpperCase();
                bp.geo_country = geoip.country;
                chrome.browserAction.setBadgeText({text: bp.geo_code});
            }
            else {
                bp.geo_country = "";
                bp.geo_code = "  ";
            }
        }, function(status) {
            console.log(status);
            bp.geo_country = "";
            bp.geo_code = "  ";
        });
};

var setPopUp = function() {
    document.getElementById("status").innerText = bp.status_text;

    if (bp.evc !== evc && bp.ssh_exists === true) {
        setFlags();
        if (bp.geo_country !== "") {
            evc = bp.evc;
        }
    }

    var tlag = document.getElementById('tlag');
    if (tlag !== null) {
        document.body.removeChild(tlag);
    }

    if (bp.geo_country !== "") {
        var loc = document.createElement("div");
        var flg = document.createElement("span");
        loc.setAttribute('class', 'tlag');
        loc.setAttribute('id', 'tlag');
        flg.setAttribute('class', 'flag ' + 'flag-' + bp.geo_code.toLowerCase());

        var txt = document.createTextNode("Current location: " + bp.geo_country + "  ");
        loc.appendChild(txt);
        loc.appendChild(flg);
        document.body.appendChild(loc);
    }
    setTimeout(setPopUp, 400);
};


document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("viajessica").addEventListener("click", bp.compose);
    setPopUp();
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("direct").addEventListener("click", bp.clearProxy);
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("reset").addEventListener("click", bp.reset);
})
