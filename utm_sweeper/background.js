console.log('load background.js');

// NOTE set to false in production
var DEBUG = true,
    log = function() {
        if (DEBUG)
            console.log.apply(console, arguments);
    },
    log_error = function() {
        console.error.apply(console, arguments);
    },
    tab_states = {},
    getTabState = function(tabId) {
        if (!(tabId in tab_states)) {
            tab_states[tabId] = {
                // popup_indicator is the pridiction of future, what the action
                // will be for the next time and further, it has no assocication
                // with the current status.
                popup_indicator: 0
            };
        }
        return tab_states[tabId];
    },
    deleteTabState = function(tabId) {
        delete tab_states[tabId];
    },
    changeIcon = function(tabId, type) {
        var icon_path;
        if (type == 'question') {
            icon_path = 'assets/b/icon_q_48_3.png';
        } else {
            icon_path = 'assets/b/icon_48.png';
        }
        chrome.pageAction.setIcon({
            tabId: tabId,
            path: icon_path
        });
    };


var onURLChanged = function(event, o) {
    var url = o.url,
        tabId = o.id,
        st = getTabState(tabId),
        stripped;
    log('URL changed', event, o);

    var parsed = parseURL(url);
    log('url noquery:', parsed.url_noquery,
        '\nquery:', parsed.query,
        '\nfragment:', parsed.fragment,
        '\npopup_indicator:', st.popup_indicator);

    if (parsed.query) {
        // As long as there's query, the page action button should be shown

        if (st.popup_indicator > 0) {
            setActionStatus(tabId, 'visiable_popup');
        } else {
            setActionStatus(tabId, 'visible_click');
        }
    } else {
        // If no query, simpliy hide the page action button
        setActionStatus(tabId, 'invisible');
    }

    // Whatever happen, a url change should reset popup_indicator to 0
    st.popup_indicator = 0;
};


var setActionStatus = function(tabId, st) {
    console.log('setActionStatus', tabId, st);
    // visible_click, visiable_popup, invisible
    switch (st) {
        case 'visible_click':
            chrome.pageAction.setPopup({
                tabId: tabId,
                popup: ''
            });
            changeIcon(tabId, 'normal');
            chrome.pageAction.show(tabId);
            break;
        case 'visiable_popup':
            // When popup is set, pageAction.onClicked won't be triggered
            chrome.pageAction.setPopup({
                tabId: tabId,
                popup: 'popup.html'
            });
            changeIcon(tabId, 'question');
            chrome.pageAction.show(tabId);
            break;
        case 'invisible':
            chrome.pageAction.hide(tabId);
            break;
        default:
            log_error('Bad status in setActionStatus:', st);
            break;
    }
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


// This function should always be idempotent
var stripURL = function(url, strip_query, strip_fragment) {
    // TODO avoid multiple calling of parseURL
    var parsed = parseURL(url),
        url_noquery = parsed.url_noquery,
        stripped_query = parsed.query,
        fragment = parsed.fragment,

        stripped_url,
        rules = getRules(url),
        rule;

    if (strip_query || strip_fragment) {
        var rv = url_noquery;
        if (!strip_query)
            rv += url_noquery;
        if (!strip_fragment)
            rv += fragment;
        return rv;
    }

    rules.forEach(function(rule) {
        var pattern = rule + '=[^&]*' + '&?',
            // Add 'g' flag so that String.replace can affect on all occurrences
            re = new RegExp(pattern, 'g');

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
    var tabId = o.id,
        url = o.url,
        stripped = stripURL(url);
    console.log('click', tabId, arguments);

    var st = getTabState(tabId);

    if (url != stripped) {
        // 2 means only next time (url changes) it would be popup, after next time it won't be
        // st.popup_indicator = 2;
        st.popup_indicator = 1;
        chrome.tabs.update(tabId, {
            url: stripped
        });
    } else {
        // 1 means next time (url changes) it won't be popup, whereas 0 is the initial
        // st.popup_indicator = 1;
        st.popup_indicator = 0;
        setActionStatus(tabId, 'visiable_popup');
    }
    console.log('stripped:', stripped);
});


// Listen on url change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'loading' &&
        (tab.url.indexOf('http:') === 0 || tab.url.indexOf('https:') === 0))
        onURLChanged('tabs.onUpdated', tab);
});


chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    log('tab removed', tabId);
});
