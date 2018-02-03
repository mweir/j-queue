// Copyright (c) 2018
// @author Michael Weir
// Use of this source code is govered by the GPLv3 license that can be
// found in the LICENSE file

// This file is responsible for letting the user configure which novels
// to follow. It query's j-novel for the available novel list and then
// displays that list as checkbox list that the user can select which
// novels to follow.


// Feed
var feedUrl = 'https://api.j-novel.club/api/series?filter={%22order%22:%22title%22}'

// XMLHttpRequest
var req;

// The JSON Object representing the series retrieved from
// j-novel API. The extension needs to pull the list from the server
// in cases novels were added or removed
var web_series_list = null;
var follow_series_list = [];

// Main function responsible for querying the list of available novels
// in alphabetical order
function main()
{
    req = new XMLHttpRequest();
    req.onload = handleResponse;
    req.onerror = handleError;
    req.open('GET', feedUrl, true);
    req.send(null);
}

// Handles feed parsing errors.
function handleOptionsParsingFailed(error)
{
    var options = document.getElementById('options');
    options.className = 'error';
    options.innerText = 'Error: ' + error;
}

// Handles errors during the XMLHttpRequest.
function handleError()
{
    handleOptionsParsingFailed('Failed to fetch Novel List.');
}

// Handles parsing the feed data we got back from XMLHttpRequest.
function handleResponse()
{
    web_series_list = JSON.parse(req.response);
    if (!web_series_list) {
        handleOptionsParsingFailed('Not a valid feed.');
        return;
    }

    buildOptionsList();
}

// Function is responsible for building the list of available novels
// and displaying the results as a checkbox list. When the user
// saves their seleection. The extension saves the selected novel
// list via the sync storage API
function buildOptionsList()
{
    var options = document.getElementById('options');
    // Set ARIA role indicating the feed element has a tree structure

    options.setAttribute('role', 'tree');

    var list = document.createElement('ul');

    for (var i = 0; i < web_series_list.length; i++) {
        var novel_obj = web_series_list[i];
        var item = document.createElement('li');
        var checkbox = document.createElement('input');
        var label = document.createElement('label');

        // Initialize the checkbox
        checkbox.type = "checkbox";
        checkbox.name = novel_obj.id;
        checkbox.value = "follow";
        checkbox.id = novel_obj.id;

        // Initialize the label
        label.htmlFor = novel_obj.id;
        label.appendChild(document.createTextNode(novel_obj.title));

        // Sets its list items contents
        item.appendChild(checkbox);
        item.appendChild(label);

        // Add it to the list item to the list
        list.appendChild(item);

        console.log(novel_obj.title);
    }

    options.appendChild(list);

    // Restore the previous options and enable the save button
    restore_options();
}

// Function responsible for saving the list of novels the user
// wants to follow
function save_options()
{
    follow_series_list = [];

    for (var i = 0; i < web_series_list.length; i++) {
        var novel_obj = web_series_list[i];

        var follow = document.getElementById(novel_obj.id).checked

        if (follow) {
            var follow_novel_obj = {};

            follow_novel_obj.id = novel_obj.id;
            follow_novel_obj.title = novel_obj.title;
            follow_novel_obj.titleslug = novel_obj.titleslug;

            follow_series_list.push(follow_novel_obj);
        }
    }

    chrome.storage.sync.set({"follow_list": JSON.stringify(follow_series_list)}, save_callback);
}

// Function responsibile for querying the list of novels the user is already following
// and pre-populating those selections
function restore_options()
{
    chrome.storage.sync.get("follow_list", restore_callback);
}

// Function that handles pre-populating the selected novel list.
function restore_callback(items)
{
    if (items.hasOwnProperty('follow_list')) {
        var restore_series_list = JSON.parse(items.follow_list);

        console.log(restore_series_list);

        for (var i = 0; i < restore_series_list.length; ++i) {
            var novel_obj = restore_series_list[i];
            var checkbox = document.getElementById(novel_obj.id)

            // If there is not a checkbox is not present with the id matching the
            // novel id. Either the series ID has changed or the series has been removed
            // in either case silently ignore and continue
            if (!checkbox)
                continue;

            checkbox.checked = true;
        }
    }

    // Now that the previous options are restored the user can change them
    document.getElementById('save').addEventListener('click', save_options);
    document.getElementById('clear').addEventListener('click', clear_storage);
}

// Function callback that handles the response when the user saves their selection
function save_callback()
{
    var bgPage;

    alert('J-Queue Updated');

    // Clears the previous poll timer (if one exists) and creates a new one
    // Also manually kicks off the chapter list poll so any new novels added
    // will have a chapter list immediately available
    chrome.alarms.clear("poll");
    chrome.alarms.create("poll", {delayInMinutes: 1440, periodInMinutes: 1440});
    bgPage = chrome.extension.getBackgroundPage();
    bgPage.poll();
}

// Function callback that handle the user clearing their novel selection
function clear_storage()
{
    // Unsets all the checkboxes
    for (var i = 0; i < web_series_list.length; i++) {
        var novel_obj = web_series_list[i];
        document.getElementById(novel_obj.id).checked = false;
    }

    // Disable the poll timer and clear the sync storage used
    // to hold the follow novel list
    chrome.alarms.clear("poll");
    chrome.storage.sync.clear(clear_callback);
}

function clear_callback()
{
    alert('J-Queue Cleared Selected Series');
}

// Add event listener for when the script is loaded.
document.addEventListener('DOMContentLoaded', main);
