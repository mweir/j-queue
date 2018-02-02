
function send_headers_callback(e){
    console.log(e);
}

var filter = {urls: ["<all_urls>"]};

chrome.webRequest.onSendHeaders.addListener(
    send_headers_callback, filter, ["requestHeaders"]);
