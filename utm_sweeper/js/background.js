/* import 'sweeper'; */

sweeper.log('Extension loaded');


// Listen on click
chrome.pageAction.onClicked.addListener(function(o) {
    var tabId = o.id,
        url = o.url;
    sweeper.log('click', tabId, arguments);

    sweeper.stripTabURL(tabId, url);
});


// Listen on url change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'loading' &&
        (tab.url.indexOf('http:') === 0 || tab.url.indexOf('https:') === 0))
        sweeper.onURLChanged('tabs.onUpdated', tab);
});


// Listen on tab close
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    sweeper.log('tab removed', tabId);
});


// Listen on messages
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action) {
        switch (msg.action) {
            case 'sweep-all':
                sweeper.getCurrentTab(function(tab) {
                    sweeper.stripTabURL(tab.id, tab.url, true, true);
                });
                sweeper.log('sweep-all');
                break;
            case 'sweep-fragment':
                sweeper.getCurrentTab(function(tab) {
                    sweeper.stripTabURL(tab.id, tab.url, false, true);
                });
                sweeper.log('sweep-fragment');
                break;
            default:
                sweeper.log_error('Bad message action:', st);
                break;
        }
    }
});
