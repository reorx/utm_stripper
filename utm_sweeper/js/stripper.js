(function(window) {

    // NOTE set to false in production
    var exports = {},
        DEBUG = true,
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
                icon_path = 'images/icon_q_48_3.png';
            } else {
                icon_path = 'images/icon_48.png';
            }
            chrome.pageAction.setIcon({
                tabId: tabId,
                path: icon_path
            });
        },
        getCurrentTab = function(callback) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                callback(tabs[0]);
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

        if (parsed.query || parsed.fragment) {
            // As long as there's query or fragment, the page action button should be shown

            if (st.popup_indicator > 0) {
                setActionStatus(tabId, 'visiable_popup');
            } else {
                setActionStatus(tabId, 'visible_click');
            }
        } else {
            // If no query or fragment, simpliy hide the page action button
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
        /*
        According to URI Syntax: https://en.wikipedia.org/wiki/Uniform_Resource_Identifier#Syntax
        , a url should be like:
        scheme:[//[user:password@]host[:port]][/]path[?query][#fragment]
        Thus `#` is behind of `?`, we should slice fragment first.
        */

        var url_noquery = url,
            query,
            fragment,
            p1, p2;

        // Parse fragment
        p1 = url_noquery.indexOf('#');
        if (p1 == -1) {
            fragment = '';
        } else {
            fragment = url_noquery.slice(p1);
            url_noquery = url_noquery.slice(0, p1);
        }

        // Parse query
        p2 = url_noquery.indexOf('?');
        if (p2 == -1) {
            query = '';
        } else {
            query = url_noquery.slice(p2);
            url_noquery = url_noquery.slice(0, p2);
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
                rv += stripped_query;
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


    var stripTabURL = function(tabId, url, strip_query, strip_fragment) {
        var stripped = stripURL(url, strip_query, strip_fragment),
            st = getTabState(tabId);

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
        log('stripped:', stripped);
    };

    exports = {
        log: log,
        log_error: log_error,
        getCurrentTab: getCurrentTab,
        onURLChanged: onURLChanged,
        setActionStatus: setActionStatus,
        getRules: getRules,
        parseURL: parseURL,
        stripURL: stripURL,
        stripTabURL: stripTabURL,
    };


    // Simplest way to define a module (not compatible with AMD or CommonJS,
    // just in a so called modular style)
    window.stripper = exports;
    return exports;
})(window);
