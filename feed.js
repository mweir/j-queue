
var series_list;

function main() {
    console.log(btoa("p"));
    console.log(atob(btoa("paul.michael.weir@gmail.com:pw4mike2")));
    load_series_list();
}

function load_series_list()
{
    chrome.storage.sync.get("series_list", load_callback);
}

function load_callback(items)
{
    if (items.hasOwnProperty('series_list')) {
        var cookie_filter = {};
        series_list = JSON.parse(items.series_list);
        chrome.cookies.getAll(cookie_filter, cookie_callback);
    }
    else {
        handleEmptyFeed();
    }
}

function cookie_callback(cookies)
{
    console.log(cookies);
    var feedUrl = 'https://api.j-novel.club/api/users/58a4a1787e51ff3b66eb31ea';

    req = new XMLHttpRequest();
    req.open('GET', feedUrl, true);
    req.setRequestHeader("Authorization", "Basic " + btoa("paul.michael.weir@gmail.com:password"));
    req.withCredentials = true;
    req.onload = handleResponse;
    req.onerror = handleError;
    req.send(null);
}

function handleError()
{
    console.log("Error:")
    console.log(req)
}

function handleResponse()
{
    console.log("Success");
    console.log(req);
}
 

function handleEmptyFeed()
{
    var feed = document.getElementById('feed');
    feed.innerText = "Select Series to follow via the Options Menu";
}


function buildFeedList(series_list) {

    var not_following = true;
    var feed = document.getElementById('feed');
    // Set ARIA role indicating the feed element has a tree structure

    feed.setAttribute('role', 'tree');

    var list = document.createElement('ul');

    for (var i = 0; i < series_list.length; i++) {
        var novel_obj = series_list[i];
        if (novel_obj.follow) {
            var item = document.createElement('li');

            // Sets its contents
            item.appendChild(document.createTextNode(novel_obj.title));

            // Add it to the list
            list.appendChild(item);

            console.log(novel_obj.title);

            not_following = false;
        }
    }

    if (not_following)
        handleEmptyFeed();
    else
        feed.appendChild(list);
}


document.addEventListener('DOMContentLoaded', main);
