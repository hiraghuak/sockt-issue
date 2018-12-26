function checkMobile() {
    return navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i) || navigator.userAgent.match(/Mobile Safari/i) ? !0 : !1
}

function SupportedMSE() {
    return window.MediaSource = window.MediaSource || window.WebKitMediaSource, window.MediaSource && "function" == typeof window.MediaSource.isTypeSupported && window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')
}

function checkHLS() {
    if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) return !0;
    try {
        var e = document.createElement("video");
        if (isSupp = e.canPlayType("application/vnd.apple.mpegURL"), "probably" == isSupp || "maybe" == isSupp) {
            sarannyuhasFlash = !1;
            try {
                sarannyuhasFlash = Boolean(new ActiveXObject("ShockwaveFlash.ShockwaveFlash"))
            } catch (n) {
                sarannyuhasFlash = "undefined" != typeof navigator.mimeTypes["application/x-shockwave-flash"]
            }
            return sarannyuhasFlash ? !1 : !0
        }
        return !1
    } catch (a) {
        return !1
    }
}

function saranyuplayer(e, n, a) {
    function t(e) {
        e.advertising && e.advertising.forEach(function (e) {
            return console.log(e.client), "googleima" == e.client || "openx" == e.client ? void(r = !0) : void 0
        })
    }
    var r = !1;
    t(a), saranyuplayertwo(e, n, a)
}

function saranyuplayertwo(e, n, a) {
    container1 = n, object1 = a;
    var t, r;
    currentURLType = e;
    for (var i = document.getElementsByTagName("script"), c = "", o = 0; o < i.length - 1; o++) i[o].src.indexOf("sp1.js") > -1 && (c = i[o].src.split("/sp1.js")[0]);
    r = [c + "/../external/sp.jquery.hammer.js", c + "/../external/boostrap/bootstrap.min.js", c + "/../external/sp.owl.carousel.js", c + "/../external/hls.min.js", c + "/../external/dash.min.js"], t = checkMobile() ? [c + "/../skins/sphlsdashmobile.css", c + "/../external/sp.owl.carousel.css"] : [c + "/../skins/sphlsdash.css", c + "/../external/sp.owl.carousel.css"], html5js = c + "/../plugin/sphlsdash.js";
    var s = document.createElement("script");
    s.type = "text/javascript", s.src = r[0], document.body.appendChild(s);
    var d = document.createElement("script");
    d.type = "text/javascript", d.src = r[1];
    var l = document.createElement("script");
    l.type = "text/javascript", l.src = r[2];
    var p = document.createElement("script");
    p.type = "text/javascript", p.src = r[3];
    var u = document.createElement("script");
    u.type = "text/javascript", u.src = r[4], s.addEventListener("load", function () {
        jss = !0, document.body.appendChild(d)
    }), d.addEventListener("load", function () {
        jss && document.body.appendChild(l)
    }), l.addEventListener("load", function () {
        document.body.appendChild(p)
    }), p.addEventListener("load", function () {
        document.body.appendChild(u)
    }), u.addEventListener("load", function () {
        checkLicence(container1, object1);
    });
    for (var o = 0; o < t.length; o++) {
        var h = document.createElement("link");
        h.type = "text/css", h.href = t[o], h.rel = "stylesheet", document.body.appendChild(h)
    }
}

function checkBandwidth() {
    var e = navigator.connection || navigator.mozConnection || navigator.webkitConnection,
        e = window.navigator.connection;
    if (!e) {
        e.type, e.downlinkMax || e.bandwidth
    }
}

function checkMediaType(e) {
    return "" == e.file[0].content_url ? (currentURLType = "hls", "hls") : -1 != e.file[0].content_url.indexOf("mpd") ? (currentURLType = "mpd", "mpd") : -1 != e.file[0].content_url.indexOf("m3u8") ? (currentURLType = "hls", "hls") : (currentURLType = "mp4", "mp4")
}

function checkMediaURL(e) {
    return "" == e.content_url ? "hls" : -1 != e.content_url.indexOf("mpd") ? "mpd" : -1 != e.content_url.indexOf("m3u8") ? "hls" : "mp4"
}

function checkLicence(e, n) {
    generatePlayer(e, n);
}

function generatePlayer(e, n) {
    var a = document.createElement("script");
    a.type = "text/javascript", a.src = html5js, document.body.appendChild(a), a.addEventListener("load", function () {
        hlsPlayer = checkMobile() && "mpd" == checkMediaType(n) ? new SaranyuHlsHTML5Player.MediaPlayer(e, n, "mpd") : checkMobile() && "hls" == checkMediaType(n) && SupportedMSE() ? new SaranyuHlsHTML5Player.MediaPlayer(e, n, "hls") : "mpd" == checkMediaType(n) ? new SaranyuHlsHTML5Player.MediaPlayer(e, n, "mpd") : checkMobile() || "mp4" == checkMediaType(n) ? new SaranyuHlsHTML5Player.MediaPlayer(e, n, "mp4") : new SaranyuHlsHTML5Player.MediaPlayer(e, n, "hls");
        try {
            createEventCallBacks()
        } catch (a) {}
    })
}
var html5js, hlsPlayer, htmlPlayer;