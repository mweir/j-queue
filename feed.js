// Copyright (c) 2018
// @author Michael Weir
// Use of this source code is govered by the GPLv3 license that can be
// found in the LICENSE file

// This file is responsible for displaying the User's queue

var userUrl = 'https://api.j-novel.club/api/users/';
var userFilter = '?filter={%22include%22:[%22accessTokens%22,%22credentials%22,%22identities%22,%22readParts%22,%22roles%22,%22subscriptions%22]}'
var redirectURL = 'https://j-novel.club/read/'

var follow_list;
var parts_hash_table;
var read_parts;
var req;

// Main function responsible for loading the queue and displaying the results
function main() {
    load_follow_list();
}

// Loads the list of novels that the user is following and
// then calls the load callback
function load_follow_list()
{
    chrome.storage.sync.get("follow_list", load_callback);
}

// Load callback parses the novel follow list. It handles displaying
// a message to the user if they have not configured a list of novels to
// follow
function load_callback(items)
{
    // Check if the a follow list exists
    if (!items.hasOwnProperty('follow_list')) {
        handleEmptyFeed();
        return;
    }
   
    // Cheks if there are any novels in the list 
    follow_list = JSON.parse(items.follow_list);
    if (follow_list.length == 0) {
        handleEmptyFeed();
        return;
    }
    
    // Query's the user information about which chapters
    // the user has already read
    read_user_info();
}

// Function responsilbe for loading both the available chapter list and the
// chapter list that the user has already read
function read_user_info()
{
    chrome.storage.local.get(["auth_obj", "parts_hash_table"], storage_callback);
}

// Storage callback responsible for parsing the available chapter list
// and forming the HTTP request to query which chapters the user has
// already read
function storage_callback(items) {
    // Parses the available chapter list
    if (items.hasOwnProperty('parts_hash_table')) {
        parts_hash_table = JSON.parse(items.parts_hash_table);
    }

    // Parses the auth object needed to query the chapters the user
    // has already read.
    if (items.hasOwnProperty('auth_obj')) {
        var auth_obj = JSON.parse(items.auth_obj);
        console.log(auth_obj);

        req = new XMLHttpRequest();
        req.open('GET', userUrl + auth_obj.user_id + userFilter, true);
        req.onload = handleResponse;
        req.onerror = handleError;
        req.setRequestHeader('Authorization', auth_obj.auth_value);
        req.send(null);
    }
    else {
        handleFeedConnectionError(401);
    }
}

// Handles an HTTP request error form the query user info request
function handleError()
{
    console.log("Error:")
    console.log(req)
    feed.innerText = "Authorization Error: Try re-logging in to J-novel.";
}

// Handles the response of HTTP request
function handleResponse()
{
    if (req.status == 200) {
        read_parts = JSON.parse(req.response).readParts;
        buildFeedList();
    }
    else {
        handleFeedConnectionError(req.status);
    }
}
 
function displayMessage(message) {
    var feed = document.getElementById('feed');

    var message_div = document.createElement('div');
    message_div.classList.add('message');
    message_div.innerText = message;
    feed.appendChild(message_div);
}

// Function prints a message informing the user that their
// following list is empty
function handleEmptyFeed()
{
    displayMessage("Select Series to follow via the Options Menu");
}

// Prints an error message when the HTTP request fails
function handleFeedConnectionError(errorStatus)
{
    displayMessage("Connection Error: Verify you are " +
        "logged into J-novel. HTTP Status: " + errorStatus);
}

// Function returns whether the user has already read the chapter or not
function read_chapter(part_id)
{
    for (var i = 0; i < read_parts.length; i++) {
        if (read_parts[i].partId == part_id) {
            return true;
        }
    }

    return false;
}

// Function handles displaying or hidding the chapter list for
// the various novels
function activate_accordion_buttons() {
    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }
        });
    }
}

// Function handles opening the selected chapter in a new tab.
function activate_hyperlinks() {
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        (function () {
            var ln = links[i];
            var location = ln.href;
            ln.onclick = function () {
                chrome.tabs.create({active: true, url: location});
            };
        })();
    }
}

// Handles building the queue. It loops through the follow novel list
// and adds a novel button if the novel contains any unread chapters.
// When the button is pressed, the unread chapter are displayed to the
// user. The user can click the chapter to open the chapter in a new tab
function buildFeedList() {

    var not_following = true;
    var feed = document.getElementById('feed');
    var empty_feed = true;

    // Set ARIA role indicating the feed element has a tree structure
    feed.setAttribute('role', 'tree');

    for (var i = 0; i < follow_list.length; i++) {
        var unread_count = 0;
        var novel_obj = follow_list[i];
        var parts = parts_hash_table[novel_obj.id];
        var unread = [];

        for (var j = 0; j < parts.length; j++) {
            if (!read_chapter(parts[j].id)) {
                unread_count = unread_count + 1;
                unread.push(parts[j]);
            }
        }
        
        if (unread_count == 0) {
            continue;
        }

        empty_feed = false;

        var novel_button = document.createElement('button');
        novel_button.innerText = novel_obj.title + " (" + unread_count + ")";
        novel_button.classList.add('accordion');
        
        var part_div = document.createElement('div');
        part_div.classList.add('panel');

        feed.appendChild(novel_button);
        feed.appendChild(part_div);

        for (var j = 0; j < unread_count; j++) {
            var part_section = document.createElement('div');
            var part_hyperlink = document.createElement('a');
            part_hyperlink.innerText = unread[j].title;
            part_hyperlink.setAttribute('href', redirectURL + unread[j].titleslug);
            part_section.appendChild(part_hyperlink);
            part_div.appendChild(part_section);
        }
    
        console.log(novel_obj.title);
    }

    if (empty_feed) {
        displayMessage("All Chapters have been read. You can add more novels via the Options Menu");
    }
    else {
        activate_accordion_buttons();
        activate_hyperlinks();
    }
}


// Add a listener to run main when the script loads
document.addEventListener('DOMContentLoaded', main);
