// Copyright (c) 2018
// @author Michael Weir
// Use of this source code is govered by the GPLv3 license that can be
// found in the LICENSE file

// This file contains the following background functionality
//   - Send XMLHttpRequest Send Headers Callback
//      * Intercepts request to api.j-novel.club/users to intercept the user
//        authentication id so that the extension can query user information
//   - Alarm Callback
//     * The alarm callback fires once a day. When fired the extension polls
//       j-novel for new chapter and for chapters that have expired. Saves the
//       result locally for the feed.js to use
//   - Page Action
//     * Handles when the enable the page action functionality (when
//       the user is on j-novel.club


//================== XMLHttpRequest Send Headers Callback =====================
var base_url = "https://api.j-novel.club/api/users/"
var filter = {urls: [base_url + "*"]};

// Function is notified any time a call is made to api.j-novel.club/api/users
// The function looks saves both the user id and the authorization token
// from the request. This information is used by feed.js to query
// which chapter a user has already read
//
// @param req  The HTTP request object
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

        chrome.storage.local.set({"auth_obj": JSON.stringify(auth_obj)},
            save_auth_callback);
    }
}

// Empty function that is called after the auth object is saved
function save_auth_callback()
{
}

// Adds a listener for HTTP request that go to api.j-novel.club/api/users
chrome.webRequest.onSendHeaders.addListener(
    send_headers_callback, filter, ["requestHeaders"]);

//================== Alarm Callback + Chapter Polling =========================
var seriesUrl = 'https://api.j-novel.club/api/series/findOne?filter={%22where%22:{%22titleslug%22:%22'
var seriesInclude = '%22},%22include%22:[%22parts%22]}'
var follow_series_list;
var follow_index;
var parts_hash_table;
var req;

// This function retrieves the list of novels the user is following. For each
// novel in the list, the poll function retrieves the chapter list and
// saves the updated list to be used by feed.js. This function either
// by the alarm callback (once a day) or when the user modifies the list
// of novels which they are following
function poll()
{
    parts_hash_table = {};
    chrome.storage.sync.get('follow_list', poll_callback);
}

// This function is the callback funciton that handle parsing the
// follow novel list. It parses the list and the kicks off the process
// of retrieving the chapter list for each of the novels the user is
// following
function poll_callback(items)
{
    follow_index = 0;

    if (items.hasOwnProperty('follow_list')) {
        follow_series_list = JSON.parse(items.follow_list);
        retrieve_series_parts();
    }
}

// This function is a recursive function that is controlled by the
// global variable follow_index. Follow index is initialized by
// poll_callback to zero. It controls which novel chapter list the background
// script is updating. After upating a novel chapter list, the funciton
// increments the follow_index and calls itself to update the next novel
// chapter list. When the follow_index equals the last novel, the
// function returns
function retrieve_series_parts()
{
    if (follow_series_list.length <= follow_index) {
        chrome.storage.local.set({
            "parts_hash_table": JSON.stringify(parts_hash_table)},
            save_callback);
        return;
    }

    var titleslug = follow_series_list[follow_index].titleslug;

    // Request to update the novel chapter list
    req = new XMLHttpRequest();
    req.onload = handleResponse;
    req.onerror = handleError;
    req.open('GET', seriesUrl + titleslug + seriesInclude, true);
    req.send(null);
}

// Handles the update novel chapter list HTTP request response. The function
// parses the response and adds all the unexpired chapters to the chapter
// hash table.
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

// Handles an error when trying to update the novel chapter list
function handleError()
{
    console.log(req);
}

// Alarm Callback. The alarm callback is called when the alarms fires. It
// initiates the update chapter list process.
function alarm_callback(alarm)
{
    console.log("Got an alarm", alarm);
    poll();
}

// Adds a listener for alarms
chrome.alarms.onAlarm.addListener(alarm_callback);

//============================ Page Action ====================================

// Callback function that checks if the user is visiting j-novel.club.
// If the users is visiting j-novel, the extension enables the page action.
function checkForValidUrl(tabId, changeInfo, tab)
{
    if (tab && tab.url) {
        if (tab.url.indexOf('j-novel.club') > -1) {
            chrome.pageAction.show(tabId);
        }
    }
}

// Adds a listener for tab updates
chrome.tabs.onUpdated.addListener(checkForValidUrl);
