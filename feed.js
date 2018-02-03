
var userUrl = 'https://api.j-novel.club/api/users/';
var userFilter = '?filter={%22include%22:[%22accessTokens%22,%22credentials%22,%22identities%22,%22readParts%22,%22roles%22,%22subscriptions%22]}'
var redirectURL = 'https://j-novel.club/c/'

var follow_list;
var parts_hash_table;
var read_parts;
var req;

function main() {
    load_follow_list();
}

function load_follow_list()
{
    chrome.storage.sync.get("follow_list", load_callback);
}

function load_callback(items)
{
    if (!items.hasOwnProperty('follow_list')) {
        handleEmptyFeed();
        return;
    }
    
    follow_list = JSON.parse(items.follow_list);
    if (follow_list.length == 0) {
        handleEmptyFeed();
        return;
    }
    
    read_user_info();
}

function read_user_info()
{
    chrome.storage.local.get(["auth_obj", "parts_hash_table"], storage_callback);
}

function storage_callback(items) {
    if (items.hasOwnProperty('parts_hash_table')) {
        parts_hash_table = JSON.parse(items.parts_hash_table);
    }

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
}

function handleError()
{
    console.log("Error:")
    console.log(req)
}

function handleResponse()
{
    read_parts = JSON.parse(req.response).readParts;
    buildFeedList();
}
 

function handleEmptyFeed()
{
    var feed = document.getElementById('feed');
    feed.innerText = "Select Series to follow via the Options Menu";
}

function read_chapter(part_id)
{
    for (var i = 0; i < read_parts.length; i++) {
        if (read_parts[i].partId == part_id) {
            return true;
        }
    }

    return false;
}

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

function buildFeedList() {

    var not_following = true;
    var feed = document.getElementById('feed');
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
            part_hyperlink.setAttribute('href', redirectURL + unread[j].titleslug + "/search");
            part_section.appendChild(part_hyperlink);
            part_div.appendChild(part_section);
        }
    
        console.log(novel_obj.title);
    }

    activate_accordion_buttons();
    activate_hyperlinks();
}


document.addEventListener('DOMContentLoaded', main);
