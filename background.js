var base_url = "https://api.j-novel.club/api/users/"
var filter = {urls: [base_url + "*"]};
var seriesUrl = 'https://api.j-novel.club/api/series/findOne?filter={%22where%22:{%22titleslug%22:%22'
var seriesInclude = '%22},%22include%22:[%22parts%22]}'
var follow_series_list;
var follow_index;
var parts_hash_table;
var req;

function send_headers_callback(req) {
    if (req.method == "GET") {
        var auth_obj = {};
        auth_obj["user_id"] = req.url.match(base_url + "(.*)[\?/]")[1];
        if (auth_obj["user_id"]) {

            for (var i = 0; i < req.requestHeaders.length; ++i) {
                var header = req.requestHeaders[i];
                if (header.name.toLowerCase() == "authorization") {
                    auth_obj["auth_value"] = header.value;
                    break;
                }
            }
        }

        chrome.storage.local.set({"auth_obj": JSON.stringify(auth_obj)}, save_callback);
    }
}

function save_callback()
{
}

function retrieve_series_parts()
{
    if (follow_series_list.length <= follow_index) {
        chrome.storage.local.set({"parts_hash_table": JSON.stringify(parts_hash_table)}, save_callback);
        return;
    }

    req = new XMLHttpRequest();
    req.onload = handleResponse;
    req.onerror = handleError;
    req.open('GET', seriesUrl + follow_series_list[follow_index].titleslug + seriesInclude, true);
    req.send(null);
}

function handleResponse()
{
    var novel_obj = JSON.parse(req.response);
    var novel_id = novel_obj.id;
    console.log(novel_obj);
    parts_hash_table[novel_id] = [];

    for (var i = 0; i < novel_obj.parts.length; ++i) {
        var temp = {};

        if (novel_obj.parts[i].expired)
            continue;

        temp.title = novel_obj.parts[i].title;
        temp.titleslug = novel_obj.parts[i].titleslug;
        temp.id = novel_obj.parts[i].id;

        parts_hash_table[novel_id].push(temp);

    }

    follow_index = follow_index + 1;
    retrieve_series_parts();
}

function handleError()
{
    console.log(req);
}


function poll_callback(items)
{
    follow_index = 0;

    if (items.hasOwnProperty('follow_list')) {
        follow_series_list = JSON.parse(items.follow_list);
        retrieve_series_parts();
    }
}

function poll()
{
    parts_hash_table = {};
    chrome.storage.sync.get("follow_list", poll_callback);
}

function alarm_callback(alarm)
{
    console.log("Got an alarm", alarm);
    poll();
}

chrome.webRequest.onSendHeaders.addListener(
    send_headers_callback, filter, ["requestHeaders"]);

chrome.alarms.onAlarm.addListener(alarm_callback);
