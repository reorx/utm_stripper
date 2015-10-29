console.log('load background.js');

// NOTE set to false in production
var DEBUG = true;


var log = function() {
    if (DEBUG)
        console.log.apply(console, arguments);
};


var onURLChanged = function(event, o) {
    var url = o.url,
        tabId = o.id,
        stripped;
    log('URL changed', event, o);

    var parsed = parseURL(url);
    log('url noquery:', parsed.url_noquery,
        '\nquery:', parsed.query,
        '\nfragment:', parsed.fragment);

    if (parsed.query)
        chrome.pageAction.show(tabId);

    /* TODO popup when click the second time, with more options like:
    - complete strip
    - configure rules

    if (url.indexOf('baidu') > -1) {
        chrome.pageAction.setPopup({
            tabId: tabId,
            popup: 'popup.html'
        });
    } else {
        chrome.pageAction.setPopup({
            tabId: tabId,
            popup: ''
        });
        chrome.pageAction.onClicked.addListener(function() {
            log('clicked page action');
        });
    }
    */
};


var DEFAULT_RULES = [
    'ref',
    'utm_\\w+',
    'spm',
];


var getRules = function() {
    return DEFAULT_RULES;
};


var parseURL = function(url) {
    var p1 = url.indexOf('?');

    if (p1 == -1)
        return {
            url_noquery: url,
            query: '',
            fragment: ''
        };

    var url_noquery = url.slice(0, p1),
        _query = url.slice(p1);

    if (_query.length == 1)
        return {
            url_noquery: url_noquery,
            query: _query,
            fragment: ''
        };

    var p2 = _query.indexOf('#'),
        query, fragment,
        stripped_query = query;

    if (p2 == -1) {
        query = _query;
        fragment = '';
    } else {
        query = _query.slice(0, p2);
        fragment = _query.slice(p2);
    }

    return {
        url_noquery: url_noquery,
        query: query,
        fragment: fragment
    };
};


var stripURL = function(url) {
    // TODO avoid multiple calling of parseURL
    var parsed = parseURL(url),
        url_noquery = parsed.url_noquery,
        stripped_query = parsed.query,
        fragment = parsed.fragment,

        stripped_url,
        rules = getRules(url),
        rule;

    rules.forEach(function(rule) {
        var pattern = rule + '=[^&]*' + '&?',
            re = new RegExp(pattern);

        stripped_query = stripped_query.replace(re, '');
        log('pattern:', pattern, 'stripped:', stripped_query);
    });

    // A & may be left at the end of the url when the last query item
    // was stripped, so try to check and clean it after the rule process
    if (stripped_query.indexOf('&', stripped_query.length - 1) != -1) {
        stripped_query = stripped_query.slice(0, -1);
    }

    if (stripped_query == '?') {
        stripped_query = '';
    }

    return url_noquery + stripped_query + fragment;
};


// Listen on click
chrome.pageAction.onClicked.addListener(function(o) {
    var url = o.url;
    stripped = stripURL(url);

    if (url != stripped) {
        chrome.tabs.update(o.tabId, {
            url: stripped
        });
    }
    console.log('stripped:', stripped);
});


// Listen on url change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'loading')
        onURLChanged('tabs.onUpdated', tab);
});
