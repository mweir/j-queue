// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Feed
var feedUrl = 'https://api.j-novel.club/api/series?filter={%22order%22:%22title%22}'

// The XMLHttpRequest object that tries to load and parse the feed.
var req;

function main() {
  req = new XMLHttpRequest();
  req.onload = handleResponse;
  req.onerror = handleError;
  req.open('GET', feedUrl, true);
  req.send(null);
}

// Handles feed parsing errors.
function handleFeedParsingFailed(error) {
  var feed = document.getElementById('feed');
  feed.className = 'error';
  feed.innerText = 'Error: ' + error;
}

// Handles errors during the XMLHttpRequest.
function handleError() {
  handleFeedParsingFailed('Failed to fetch RSS feed.');
}

// Handles parsing the feed data we got back from XMLHttpRequest.
function handleResponse() {
  var json_obj = JSON.parse(req.response);
  if (!json_obj) {
    handleFeedParsingFailed('Not a valid feed.');
    return;
  }

  buildFeedList(json_obj);
}


function buildFeedList(json_obj) {

	var feed = document.getElementById('feed');
	// Set ARIA role indicating the feed element has a tree structure

	feed.setAttribute('role', 'tree');

	var list = document.createElement('ul');

	for (var i = 0; i < json_obj.length; i++) {
		var novel_obj = json_obj[i];
		var item = document.createElement('li');
		
		// Sets its contents
		item.appendChild(document.createTextNode(novel_obj.title));
		
		// Add it to the list
		list.appendChild(item);

        console.log(novel_obj.title);
	}

	feed.appendChild(list);
}


document.addEventListener('DOMContentLoaded', main);
