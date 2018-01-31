
// Feed
var feedUrl = 'https://api.j-novel.club/api/series?filter={%22order%22:%22title%22}'

// XMLHttpRequest
var req;

// The JSON Object representing the series retrieved from
// j-novel API. The extension needs to pull the list from the server
// in cases novels were added or removed
var web_series_list = null;

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

function save_options()
{
    var saved_series_list = [];
    for (var i = 0; i < web_series_list.length; i++) {
        var novel_obj = web_series_list[i];
        var saved_novel_obj = {};

        var follow = document.getElementById(novel_obj.id).checked

        // Previously was just adding follow to novel object and
        // saving the web series list directly. However, the web
        // series list was too big to be saved as a single object by the 
        // chrome sync interface. Thus, I just pull the information that 
        // is needed later
        saved_novel_obj.id = novel_obj.id;
        saved_novel_obj.title = novel_obj.title;
        saved_novel_obj.follow = follow;

        saved_series_list.push(saved_novel_obj);
    }

    chrome.storage.sync.set({"series_list": JSON.stringify(saved_series_list)}, save_callback);
}

function restore_options()
{
    chrome.storage.sync.get("series_list", restore_callback);
}

function restore_callback(items)
{
    if (items.hasOwnProperty('series_list')) {
        var saved_series_list = JSON.parse(items.series_list);

        console.log(saved_series_list);

        for (var i = 0; i < saved_series_list.length; ++i) {
            var novel_obj = saved_series_list[i];
            var checkbox = document.getElementById(novel_obj.id)

            // If there is not a checkbox is not present with the id matching the
            // novel id. The the series ID has changed or the nove has been removed
            // in either case silently ignore and continue
            if (!checkbox)
                continue;

            checkbox.checked = novel_obj.follow;
        }
    }

    // Now that the previous options are restored the user can change them
    document.getElementById('save').addEventListener('click', save_options);
    document.getElementById('clear').addEventListener('click', clear_storage);
}

function save_callback()
{
    alert('J-Queue Updated');
}

function clear_storage()
{
    for (var i = 0; i < web_series_list.length; i++) {
        var novel_obj = web_series_list[i];
        document.getElementById(novel_obj.id).checked = false;
    }

    chrome.storage.sync.clear(clear_callback);
}

function clear_callback()
{
    alert('J-Queue Cleared Selected Series');
}

document.addEventListener('DOMContentLoaded', main);
