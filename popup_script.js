document.getElementById('roam-tab-id').addEventListener('click', () => {
  chrome.runtime.sendMessage({ actionType: 'setRoamTabID' });
  console.log('Set Roam tab ID.');
});

document.getElementById('google-tab-id').addEventListener('click', () => {
  chrome.runtime.sendMessage({ actionType: 'setGoogleTabID' });
  console.log('Set Google tab ID.');
});

document.getElementById('wikipedia-tab-id').addEventListener('click', () => {
  chrome.runtime.sendMessage({ actionType: 'setWikipediaTabID' });
  console.log('Set Wikipedia tab ID.');
});

document.getElementById('youtube-tab-id').addEventListener('click', () => {
  chrome.runtime.sendMessage({ actionType: 'setYoutubeTabAndWindowID' });
  console.log('Set Youtube tab ID.');
});

document.getElementById('open-sync-tabs').addEventListener('click', () => {
  chrome.runtime.sendMessage({ actionType: 'openSyncTabs' });
  console.log('Open sync tabs.');
});
