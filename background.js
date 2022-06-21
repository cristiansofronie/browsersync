console.log('Fresh background.js');

// async function setYoutubeTabAndWindowID(message) {
//   const [tab] = await chrome.tabs.query({
//     url: '*://*/*syncyoutubesearch*'
//   });
//   const win = await chrome.windows.getCurrent();

//   chrome.storage.local.set({
//     youtubeTabID: tab.id
//   });
//   chrome.storage.local.set({
//     youtubeWinID: win.id
//   });
//   console.log('Youtube tab ID is:', tab.id);
//   console.log('Youtube window ID is:', win.id);
//   console.log('Youtube tab', tab);
// }

// async function setGoogleTabID(message) {
//   const [tab] = await chrome.tabs.query({
//     url: '*://*/*syncgooglesearch*'
//   });
//   chrome.storage.local.set({
//     googleTabID: tab.id
//   });
//   console.log('Google tab ID is:', tab.id);
//   console.log('Google tab', tab);
// }

// async function setWikipediaTabID() {
//   const [tab] = await chrome.tabs.query({
//     url: '*://*/*syncwikipediasearch*'
//   });
//   chrome.storage.local.set({
//     wikipediaTabID: tab.id
//   });
//   console.log('Wikipedia tab ID is:', tab.id);
//   console.log('Wikipedia tab', tab);
// }

async function fetchWikipedia(message) {
  let fetchUrl;
  if (message.query.match(/(^https|^http):\/\//)) {
    fetchUrl = message.query;
  } else {
    fetchUrl = 'https://en.wikipedia.org/wiki/Special:Search?search=' +
      encodeURIComponent(message.query);
  }

  let respUrl;
  console.log(fetchUrl);
  fetch(fetchUrl)
    .then(response => {
      respUrl = response.url;
      return response.text();
    })
    .then(txt => {
      sendResponse({
        resp: txt,
        url: respUrl
      });
    });
  console.log('Fetched from Wikipedia');
}

async function closeCurrentYoutubeTab(message) {
  // TODO:
  console.log('Work in progress');
}

async function setRoamTabID(message) {
  let [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });
  chrome.storage.local.set({
    roamTabID: tab.id
  });
  console.log('Roam tab ID is:', tab.id);
}

async function searchWikipedia(message) {
  chrome.storage.local.get(["wikipediaTabID"], ({
    wikipediaTabID
  }) => {
    chrome.tabs.update(wikipediaTabID, {
      url: 'https://en.wikipedia.org/wiki/Special:Search?search=' +
        encodeURIComponent(message.query)
    });
    console.log('Search in Wikipedia');
  });
}

async function searchYoutube(message) {
  chrome.storage.local.get(["youtubeTabID"], async ({
    youtubeTabID
  }) => {
    await chrome.tabs.update(youtubeTabID, {
      url: 'https://www.youtube.com/results?search_query=' +
        encodeURIComponent(message.query)
    });
    console.log('Search in Youtube');

    const playFirstYoutube = () => {
      window.playFirstInterval = setInterval(() => {
        if (document.querySelector('#contents #thumbnail')) {
          clearInterval(window.playFirstInterval);
          document.querySelector('#contents #thumbnail').click()
        }
      }, 100);
    }

    setTimeout(() => {
      chrome.scripting.executeScript({
        target: {
          tabId: youtubeTabID
        },
        func: playFirstYoutube,
      });
      console.log('Search first Youtube result.');
    }, 500);
  });
}

async function searchYoutubeNewTab(message) {
  chrome.storage.local.get(["youtubeWinID", "youtubeTabID"], async ({
    youtubeWinID,
    youtubeTabID
  }) => {
    const pauseYoutubeVideo = () => {
      window.playFirstInterval = setInterval(() => {
        if (document.querySelector('.ytp-play-button')) {
          clearInterval(window.playFirstInterval);
          const button = document.querySelector('.ytp-play-button');
          if (button.title.includes('Pause'))
            button.click()
        }
      }, 100);
    }

    chrome.scripting.executeScript({
      target: {
        tabId: youtubeTabID
      },
      func: pauseYoutubeVideo,
    });
    console.log('Paused Youtube video.');

    chrome.tabs.create({
      windowId: youtubeWinID,
      index: 0,
      url: 'https://www.youtube.com/results?search_query=' +
        encodeURIComponent(message.query)
    }, (tab) => {
      chrome.storage.local.set({
        youtubeTabID: tab.id
      });

      const playFirstYoutube = () => {
        window.playFirstInterval = setInterval(() => {
          if (document.querySelector('#contents #thumbnail')) {
            clearInterval(window.playFirstInterval);
            document.querySelector('#contents #thumbnail').click()
          }
        }, 100);
      }

      setTimeout(() => {
        chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          func: playFirstYoutube,
        });
        console.log('Search first Youtube result.');
      }, 1000);
    });

    console.log('Search in Youtube in new tab.');
  });
}

async function searchRoam(message) {
  chrome.storage.local.get(["roamTabID"], ({
    roamTabID
  }) => {
    const searchRoam = (query) => {
      if (!window.syncAdvSearchChannel)
        window.syncAdvSearchChannel = new BroadcastChannel('sync_adv_search');
      window.syncAdvSearchChannel.postMessage(query);
      console.log('Search Roam', query);
    }

    chrome.scripting.executeScript({
      target: {
        tabId: roamTabID
      },
      func: searchRoam,
      args: [message.query],
    });
    console.log('Search in Roam');
  });
}

async function playFirstYoutube(message) {
  chrome.storage.local.get(["youtubeTabID"], ({
    youtubeTabID
  }) => {
    const playFirstYoutube = () => {
      console.log('Should click now.');
      document.querySelector('#contents #thumbnail').click()
    }

    chrome.scripting.executeScript({
      target: {
        tabId: youtubeTabID
      },
      func: playFirstYoutube,
    });
    console.log('Search first Youtube result.');
  });
}

async function searchGoogle(message) {
  chrome.storage.local.get(["googleTabID"], ({
    googleTabID
  }) => {
    chrome.tabs.update(googleTabID, {
      url: 'https://www.google.com/search?q=' +
        encodeURIComponent(message.query)
    });
    console.log('Search in Google');
  });
}

async function handleMessage(message, sender, sendResponse) {
  if (message.actionType === 'setWikipediaTabID') {
    setWikipediaTabID();
  } else if (message.actionType === 'fetchWikipedia') {
    fetchWikipedia(message)
  } else if (message.actionType === 'closeCurrentYoutubeTab') {
    closeCurrentYoutubeTab(message);
  } else if (message.actionType === 'setYoutubeTabAndWindowID') {
    setYoutubeTabAndWindowID(message);
  } else if (message.actionType === 'setGoogleTabID') {
    setGoogleTabID(message);
  } else if (message.actionType === 'setRoamTabID') {
    setRoamTabID(message);
  } else if (message.actionType === 'searchWikipedia') {
    searchWikipedia(message);
  } else if (message.actionType === 'searchYoutube') {
    searchYoutube(message);
  } else if (message.actionType === 'searchYoutubeNewTab') {
    searchYoutubeNewTab(message);
  } else if (message.actionType === 'searchRoam') {
    searchRoam(message);
  } else if (message.actionType === 'playFirstYoutube') {
    playFirstYoutube(message);
  } else if (message.actionType === 'searchGoogle') {
    searchGoogle(message);
  }
}

chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
  console.log('Got external message.');
  handleMessage(message, sender, sendResponse);
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Got internal message.');
  handleMessage(message, sender, sendResponse);
});
