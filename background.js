console.log('Fresh background.js');

String.prototype.format = function () {
  let formatted = this;
  for (let i = 0; i < arguments.length; i++) {
    const regexp = new RegExp('\\{' + i + '\\}', 'gi');
    formatted = formatted.replace(regexp, arguments[i]);
  }
  return formatted;
};

async function setRoamTabID() {
  let [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  chrome.storage.local.set({
    roamTabID: tab.id,
  });
  console.log('Roam tab ID is:', tab.id);
}

const setSearchWindowIDBasedOnTabName = async () => {
  const [tab] = await chrome.tabs.query({
    title: 'autoOpenOmni*'
  });
  chrome.storage.local.set({
    searchWindowID: tab.windowId,
  });
  console.log('Search window tab ID: ', tab.windowId);
};

const setSearchWindowID = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  chrome.storage.local.set({
    searchWindowID: tab.windowId,
  });
  console.log('Search window tab ID: ', tab.windowId);
};

async function setYoutubeTabAndWindowID() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const win = await chrome.windows.getCurrent();

  chrome.storage.local.set({
    youtubeTabID: tab.id,
  });
  chrome.storage.local.set({
    youtubeWinID: win.id,
  });
  console.log('Youtube tab ID is:', tab.id);
  console.log('Youtube window ID is:', win.id);
}

async function fetchWikipedia(message, sender, sendResponse) {
  let fetchUrl;
  if (message.query.match(/(^https|^http):\/\//)) {
    fetchUrl = message.query;
  } else {
    fetchUrl =
      'https://en.wikipedia.org/wiki/Special:Search?search=' +
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
        url: respUrl,
      });
    });
  console.log('Fetched from Wikipedia');
}

const fetchData = (message, sender, sendResponse) => {
  let respUrl;
  fetch(message.url)
    .then(response => {
      respUrl = response.url;
      return response.text();
    })
    .then(txt => {
      sendResponse({
        resp: txt,
        url: respUrl,
      });
    });
  console.log('Fetched stuff');
};

async function searchYoutube(message) {
  chrome.storage.local.get(['youtubeTabID'], async ({ youtubeTabID }) => {
    await chrome.tabs.update(youtubeTabID, {
      url:
        'https://www.youtube.com/results?search_query=' +
        encodeURIComponent(message.query),
    });
    console.log('Search in Youtube');

    const playFirstYoutube = () => {
      window.playFirstInterval = setInterval(() => {
        if (document.querySelector('#contents #thumbnail')) {
          clearInterval(window.playFirstInterval);
          document.querySelector('#contents #thumbnail').click();
        }
      }, 100);
    };

    setTimeout(() => {
      chrome.scripting.executeScript({
        target: {
          tabId: youtubeTabID,
        },
        func: playFirstYoutube,
      });
      console.log('Search first Youtube result.');
    }, 500);
  });
}

async function searchYoutubeNewTab(message) {
  chrome.storage.local.get(
    ['youtubeWinID', 'youtubeTabID'],
    async ({ youtubeWinID, youtubeTabID }) => {
      const pauseYoutubeVideo = () => {
        window.playFirstInterval = setInterval(() => {
          if (document.querySelector('.ytp-play-button')) {
            clearInterval(window.playFirstInterval);
            const button = document.querySelector('.ytp-play-button');
            if (button.title.includes('Pause')) button.click();
          }
        }, 100);
      };

      chrome.scripting.executeScript({
        target: {
          tabId: youtubeTabID,
        },
        func: pauseYoutubeVideo,
      });
      console.log('Paused Youtube video.');

      chrome.tabs.create(
        {
          windowId: youtubeWinID,
          index: 0,
          url:
            'https://www.youtube.com/results?search_query=' +
            encodeURIComponent(message.query),
        },
        tab => {
          chrome.storage.local.set({
            youtubeTabID: tab.id,
          });

          const playFirstYoutube = () => {
            window.playFirstInterval = setInterval(() => {
              if (document.querySelector('#contents #thumbnail')) {
                clearInterval(window.playFirstInterval);
                document.querySelector('#contents #thumbnail').click();
              }
            }, 100);
          };

          setTimeout(() => {
            chrome.scripting.executeScript({
              target: {
                tabId: tab.id,
              },
              func: playFirstYoutube,
            });
            console.log('Search first Youtube result.');
          }, 1000);
        }
      );

      console.log('Search in Youtube in new tab.');
    }
  );
}

const openInSearchWin = async URL => {
  const { searchWindowID } = await chrome.storage.local.get('searchWindowID');
  chrome.tabs.create({
    windowId: searchWindowID,
    index: 0,
    url: URL,
  });
  console.log(`Opened ${URL} in ${searchWindowID}`);
};

const queueToOpenInSearchWin = async URLs => {
  let { winOpenQueue } = await chrome.storage.local.get({
    winOpenQueue: [],
  });

  winOpenQueue = winOpenQueue.concat(URLs);
  console.log('winOpenQueue', winOpenQueue);
  await chrome.storage.local.set({
    winOpenQueue
  });
};

const clearQueueToOpenInSearchWin = async URLs => {
  await chrome.storage.local.set({
    winOpenQueue: []
  });
  console.log('Cleared queue for links to open in search window');
};

const openInSearchWinFromQueue = async () => {
  const { winOpenQueue } = await chrome.storage.local.get({
    winOpenQueue: [],
  });

  const URL = winOpenQueue.pop();
  console.log('winOpenQueue', winOpenQueue);
  await chrome.storage.local.set({
    winOpenQueue
  });

  if (URL)
    await openInSearchWin(URL);
  else
    console.log('Not more URLs in queue');
};

async function searchRoam(message) {
  chrome.storage.local.get(['roamTabID'], ({ roamTabID }) => {
    const searchRoam = query => {
      if (!window.syncAdvSearchChannel)
        window.syncAdvSearchChannel = new BroadcastChannel('sync_adv_search');
      window.syncAdvSearchChannel.postMessage(query);
      console.log('Search Roam', query);
    };

    chrome.scripting.executeScript({
      target: {
        tabId: roamTabID,
      },
      func: searchRoam,
      args: [message.query],
    });
    console.log('Search in Roam');
  });
}

async function playFirstYoutube() {
  chrome.storage.local.get(['youtubeTabID'], ({ youtubeTabID }) => {
    const playFirstYoutube = () => {
      console.log('Should click now.');
      document.querySelector('#contents #thumbnail').click();
    };

    chrome.scripting.executeScript({
      target: {
        tabId: youtubeTabID,
      },
      func: playFirstYoutube,
    });
    console.log('Search first Youtube result.');
  });
}

async function searchGoogle(message) {
  chrome.storage.local.get(['googleTabID'], ({ googleTabID }) => {
    chrome.tabs.update(googleTabID, {
      url:
        'https://www.google.com/search?q=' + encodeURIComponent(message.query),
    });
    console.log('Search in Google');
  });
}

chrome.runtime.onMessageExternal.addListener(
  async (message, sender, sendResponse) => {
    console.log('Got external message.');
    handleMessage(message, sender, sendResponse);
  }
);

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Got internal message.');
  handleMessage(message, sender, sendResponse);
});

async function deleteSyncEngines() {
  await chrome.storage.local.remove('engines');
}

async function addSyncEngine(name, searchURL) {
  const { engines } = await chrome.storage.local.get({
    engines: [],
  });
  engines.push(name);
  console.log(engines);
  await chrome.storage.local.set({
    engines,
  });
  await chrome.storage.local.set({
    [name]: {
      searchURL: searchURL,
    },
  });
}

// async function searchSyncEngine(name, query) {
//   const {
//     [name]: eng
//   } = await chrome.storage.local.get(name);
//   if (eng.tabID) {
//     chrome.tabs.update(eng.tabID, {
//       url: eng.searchURL.format(encodeURIComponent(query))
//     });
//     console.log(`Searching ${name}.`);
//   } else
//     console.log(`No tab ID for ${name}`);
// }

function searchSyncEngine(name, query) {
  chrome.storage.local.get(name, ({ [name]: eng }) => {
    console.log('searchSyncEngine#(anon) eng: %o', eng); // __AUTO_GENERATED_PRINT_VAR__
    if (eng.tabID) {
      chrome.tabs.update(eng.tabID, {
        url: eng.searchURL.format(encodeURIComponent(query)),
      });
      console.log(`Searching ${name}.`);
    } else console.log(`No tab ID for ${name}`);
  });
}

// const quicksearchSyncEngine = (tabID, searchURL, query) => {
//   chrome.tabs.update(eng.tabID, {
//     url: eng.searchURL.format(encodeURIComponent(query))
//   });
// }

function searchSyncEngines(query) {
  chrome.storage.local.get({ engines: [] }, ({ engines }) => {
    engines.forEach((engName, i) => {
      setTimeout(() => {
        searchSyncEngine(engName, query);
      }, i * 500);
    });
  });
}

async function addAllSyncEngines() {
  await addSyncEngine(
    'wikipedia',
    'https://en.wikipedia.org/wiki/Special:Search?search={0}'
  );
  await addSyncEngine('google', 'https://www.google.com/search?q={0}');
  await addSyncEngine(
    'youtube',
    'https://www.youtube.com/results?search_query={0}'
  );
  await addSyncEngine(
    'cambridge',
    'https://dictionary.cambridge.org/dictionary/english/{0}'
  );
}

async function openSyncTabsBasedOnTabName() {
  const { engines } = await chrome.storage.local.get({
    engines: [],
  });

  const [winTab] = await chrome.tabs.query({
    title: 'openSyncTabs*'
  });

  for (const engName of engines) {
    console.log('Engine: ', engName);
    const { [engName]: eng } = await chrome.storage.local.get(engName);
    const tab = await chrome.tabs.create({
      url: `https://www.google.com/search?q=sync${engName}`,
      windowId: winTab.windowId
    });
    eng.tabID = tab.id;
    await chrome.storage.local.set({
      [engName]: eng,
    });
  }
}

async function openSyncTabs() {
  const { engines } = await chrome.storage.local.get({
    engines: [],
  });

  for (const engName of engines) {
    const { [engName]: eng } = await chrome.storage.local.get(engName);
    const tab = await chrome.tabs.create({
      url: `https://www.google.com/search?q=sync${engName}`,
    });
    eng.tabID = tab.id;
    await chrome.storage.local.set({
      [engName]: eng,
    });
  }
}

const getSyncEngineInfo = async () => {
  console.log('getSyncEngineInfo');
  const { engines } = await chrome.storage.local.get({ engines: [] })
  console.log(engines);

  return Promise.all(engines.map(engName =>  {
    return new Promise(async (resolve, reject) => {
      const { eng } = await chrome.storage.local.get(engName);
      console.log(engName, eng);
      resolve();
    });
  }));
};

// async function removeSesTab(ses, url) {
// }

// chrome.tabs.onRemoved.addListener(
// )

// chrome.tabs.onCreated.addListener(
// )

// chrome.tabs.onUpdated.addListener(
// )

// async function addSesTab(ses, url) {
//   chrome.storage.local.get([ses], (ses) => {
//     console.log('Session before: ', ses);
//     if (!ses.urls) {
//       ses.urls = [];
//     }
//     ses.urls.push(url);
//     console.log('Session after: ', ses);
//     chrome.storage.local.set(ses);
//   })
// }

async function handleMessage(message, sender, sendResponse) {
  if (message.actionType === 'fetchWikipedia') {
    fetchWikipedia(message, sender, sendResponse);
  } else if (message.actionType === 'fetchData') {
    fetchData(message, sender, sendResponse);
  } else if (message.actionType === 'getSyncEngineInfo') {
    getSyncEngineInfo();
  } else if (message.actionType === 'syncSearch') {
    searchSyncEngine(message.eng, message.query);
  } else if (message.actionType === 'setRoamTabID') {
    setRoamTabID(message);
  } else if (message.actionType === 'searchRoam') {
    searchRoam(message);
  } else if (message.actionType === 'focusPrevTab') {
    const { previousTab } = await chrome.storage.local.get('previousTab');
    chrome.tabs.update(previousTab, { selected: true });
  } else if (message.actionType === 'openInSearchWinFromQueue') {
    openInSearchWinFromQueue();
  } else if (message.actionType === 'clearQueueToOpenInSearchWin') {
    clearQueueToOpenInSearchWin();
  } else if (message.actionType === 'queueToOpenInSearchWin') {
    queueToOpenInSearchWin(message.URLs);
  } else if (message.actionType === 'openInSearchWin') {
    openInSearchWin(message.URL);
  } else if (message.actionType === 'setSearchWindowIDBasedOnTabName') {
    setSearchWindowIDBasedOnTabName();
  } else if (message.actionType === 'setSearchWindowID') {
    setSearchWindowID();
  } else if (message.actionType === 'searchSyncEngines') {
    searchSyncEngines(message.query);
  } else if (message.actionType === 'openSyncTabsBasedOnTabName') {
    console.log('openSyncTabsBasedOnTabName');
    openSyncTabsBasedOnTabName();
  } else if (message.actionType === 'openSyncTabs') {
    openSyncTabs();
  }
}

const main = async () => {
  await getSyncEngineInfo();
  await deleteSyncEngines();
  await addAllSyncEngines();
};

chrome.tabs.onActivated.addListener(async activeInfo => {
  const { latestTab } = await chrome.storage.local.get('latestTab');
  await chrome.storage.local.set({ previousTab: latestTab });
  await chrome.storage.local.set({ latestTab: activeInfo.tabId });
});

// chrome.tabs.onActivated.addListener(async activeInfo => {
//   const { latestTab } = await chrome.storage.local.get('latestTab');
//   await chrome.storage.local.set({ previousTab: latestTab });
//   await chrome.storage.local.set({ latestTab: activeInfo.tabId });
// });

main();
