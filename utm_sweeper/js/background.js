/* import 'stripper'; */

stripper.log('Extension loaded');


// Listen on click
chrome.pageAction.onClicked.addListener(function(o) {
    var tabId = o.id,
        url = o.url;
    stripper.log('click', tabId, arguments);

    stripper.stripTabURL(tabId, url);
});


// Listen on url change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'loading' &&
        (tab.url.indexOf('http:') === 0 || tab.url.indexOf('https:') === 0))
        stripper.onURLChanged('tabs.onUpdated', tab);
});


// Listen on tab close
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    stripper.log('tab removed', tabId);
});


// Listen on messages
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action) {
        switch (msg.action) {
            case 'sweep-all':
                stripper.getCurrentTab(function(tab) {
                    stripper.stripTabURL(tab.id, tab.url, true, true);
                });
                stripper.log('sweep-all');
                break;
            case 'sweep-fragment':
                stripper.getCurrentTab(function(tab) {
                    stripper.stripTabURL(tab.id, tab.url, false, true);
                });
                stripper.log('sweep-fragment');
                break;
            default:
                stripper.log_error('Bad message action:', st);
                break;
        }
    }
});
