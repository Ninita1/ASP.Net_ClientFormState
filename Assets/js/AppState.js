var AppState = (function () {

    var appStateId = "AppState";
    var loginStateId = "LoginState";
    var loginWasLast = false;
    var htmlToRestore = null;
    var baseTimeToWait = 50;

    var clickType_key = "key";
    var clickType_method = "function";

    var lastUrl = "";
    var lastTab = "";
    var lastClicks = [];
    var lastHtmlSaved = null;

    var currentUrl = "";
    var currentTab = "";
    var currentClicks = [];

    var leavePageEvents = [];



    function saveState() {
        //save the navigation
        if (currentUrl && currentUrl !== "") {
            cleanStateStorage();

            localStorage[appStateId] = JSON.stringify({
                lastUrl: currentUrl,
                lastTab: currentTab,
                lastClicks: currentClicks,
                htmlSaved: $(htmlToRestore).html()
            });
        }
    }

    var savePage = function () {
        //save the navigation
        saveState();

        //save the form
        $("form").each(function () {
            $(this).saveForm();
        });
    };

    var resetPage = function () {
        $("form").each(function () {
            $(this).restoreForm();
        });
    };

    var setLeavePageEvent = function (event) {
        if (event)
            leavePageEvents.push(event);
    };

    var bindLeavePageEvent = function () {
        $(window).unbind("unload").on('unload', function () {
            savePage();
            try {
                leavePageEvents.forEach(function (item, index) {
                    try {
                        if (item)
                            item();
                    }
                    catch (er) {
                        //
                    }
                });
            }
            catch (er) {
                //
            }
        });
    };

    var resetPageState = function () {
        lastUrl = "";
        lastTab = "";
        lastClicks = [];
        htmlToRestore = null;
        lastHtmlSaved = null;

        currentUrl = "";
        currentTab = "";
        currentClicks = [];

        localStorage.clear();
    };

    var loadLastState = function (url) {

        if (localStorage[appStateId]) {
            var state = JSON.parse(localStorage[appStateId]);

            lastUrl = state.lastUrl;
            lastTab = state.lastTab;
            lastClicks = state.lastClicks;
            lastHtmlSaved = state.htmlSaved;

            if (window.location.pathname + window.location.search === lastUrl)
                cleanStateStorage();

            if (lastClicks !== null && lastClicks.length > 0) {
                var tempArray = [];
                lastClicks.forEach(function (item, index) {
                    if (index === 0)
                        tempArray.push(item);
                    else {
                        var lastClick = getLastItemFromArray(tempArray);
                        if (lastClick.type !== item.type || lastClick.feature !== item.feature || lastClick.params !== item.params)
                            tempArray.push(item);
                    }
                });
                lastClicks = tempArray;
            }
            else
                lastClicks = [];
        }
    };

    var addPageClick = function (elem, method, params, ajaxCall) {

        if (elem) {
            var lastClick = getLastItemFromArray(currentClicks);

            if (method) {
                var functionName = getFunctionName(method);
                if (lastClick === null || (lastClick.type !== clickType_method || lastClick.feature !== functionName || lastClick.params !== params))
                    currentClicks.push({ type: clickType_method, feature: functionName, param: params, isAjaxCall: ajaxCall === undefined || ajaxCall === null ? false : ajaxCall });
            }
            else {
                if ($(elem).selector) {
                    if (lastClick === null || (lastClick.type !== clickType_key || lastClick.feature !== $(elem).selector))
                        currentClicks.push({ type: clickType_key, feature: $(elem).selector, isAjaxCall: ajaxCall === undefined || ajaxCall === null ? false : ajaxCall });
                }
                else {
                    elem = $(elem).get(0);
                    var classes = elem.className;
                    var id = elem.id;
                    var name = $(elem).attr("name");
                    var featureId = elem.localName
                        + (classes !== undefined && classes !== null && classes !== "" ? "." + classes.split(' ').join('.') : "")
                        + (id !== undefined && id !== null && id !== "" ? "#" + id : "")
                        + (name !== undefined && name !== null && name !== "" ? "[name='" + name + "']" : "");

                    if (featureId !== undefined && (lastClick === null || (lastClick.type !== clickType_key || lastClick.feature !== featureId)))
                        currentClicks.push({
                            type: clickType_key,
                            feature: featureId,
                            isAjaxCall: ajaxCall === undefined || ajaxCall === null ? false : ajaxCall
                        });
                }
            }
        }
    };

    function getLastItemFromArray(myArray) {
        return myArray.length > 0 ? myArray[myArray.length - 1] : null;
    }

    function getFunctionName(fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    function cleanStateStorage() {
        if (localStorage[appStateId])
            localStorage.removeItem(appStateId);
    }

    function forgetLastState() {
        cleanStateStorage();

        lastUrl = "";
        lastTab = "";
        lastClicks = [];
        htmlToRestore = null;
        lastHtmlSaved = null;
    }

    var cancelLastPageClick = function (event) {

        if (currentClicks) {
            if (event) {
                if (currentClicks.indexOf(event) > -1)
                    currentClicks.splice(currentClicks.indexOf(event), 1);
            }
            else
                currentClicks.pop();
        }
    };
        
    var setTabClick = function (tab) {
        currentTab = tab;
        currentClicks = [];
    };
    
    var loadPage = function (htmlToSave)
    {
        if (htmlToSave !== undefined && htmlToSave !== null && htmlToSave !== "")
            htmlToRestore = htmlToSave;

        loadLastState();
        
        currentUrl = window.location.pathname + window.location.search;
        if (currentUrl === lastUrl)
        {
            var requestsNotFinished = false;

            setTimeout(function () { //for the tabs calls, etc

                if (lastTab) {
                    var tab = $(".nav-tabs li a[href='" + lastTab + "']");
                    if ($(tab).length > 0) {
                        $(tab).trigger("click");
                        lastTab = "";
                    }
                    else
                        requestsNotFinished = true;
                }
                else
                    lastTab = "";

                var executedFunction = false;
                
                var remainClicks = [];
                var extraTimeToWait = 0;
                if (lastClicks)
                    lastClicks.forEach(function (item, index) {
                        try {
                            if (item) {
                                if (item.type === clickType_key) {
                                    if ($(item.feature).length > 0) {
                                        if (item.isAjaxCall) extraTimeToWait += baseTimeToWait;
                                        $(item.feature).trigger("click");
                                    }
                                    else {
                                        remainClicks.push(item);
                                    }
                                }
                                else if (item.type === clickType_method) {
                                    if (window[item.feature] !== undefined && window[item.feature] !== null) {
                                        if (item.isAjaxCall) extraTimeToWait += baseTimeToWait;
                                        window[item.feature](item.param ? item.param : null); //the first parameter must be an URL
                                        executedFunction = true;
                                    }
                                    else {
                                        remainClicks.push(item);
                                    }
                                }
                                else {
                                    remainClicks.push(item);
                                }
                            }
                        }
                        catch (er) {
                            //
                        }
                    });
                
                if (remainClicks.length > 0) {
                    //save the missing navigation
                    currentTab = lastTab;
                    currentClicks = remainClicks;

                    saveState();
                }
                else {
                    forgetLastState();

                    var timeout = (executedFunction ? baseTimeToWait * 3 : baseTimeToWait) + extraTimeToWait * 50; //*50 because the dialogs
                    setTimeout(function () { //for the form partial views calls
                        if (lastHtmlSaved !== null && lastHtmlSaved !== "" && htmlToRestore !== null && htmlToRestore !== "" && $(htmlToRestore).length > 0)
                            $(htmlToRestore).html(lastHtmlSaved);

                        resetPage();
                    }, timeout);
                }
            }, 50);
        }
        else {
            currentTab = "";
            currentClicks = [];
        }

        bindLeavePageEvent();
    };

    var loadPartialPage = function ()
    {        
        setTimeout(function () { //for the de form partial views calls

            loadLastState();
            currentUrl = window.location.pathname + window.location.search;

            if (currentUrl === lastUrl) {
                var executedFunction = false;
                
                var remainClicks = [];
                var extraTimeToWait = 0;
                if (lastClicks)
                    lastClicks.forEach(function (item, index) {
                        try {
                            if (item) {
                                if (item.type === clickType_key) {
                                    if ($(item.feature).length > 0) {
                                        if (item.isAjaxCall) extraTimeToWait += baseTimeToWait;
                                        $(item.feature).trigger("click");
                                    }
                                    else {
                                        remainClicks.push(item);
                                    }
                                }
                                else if (item.type === clickType_method) {
                                    if (window[item.feature] !== undefined && window[item.feature] !== null) {
                                        if (item.isAjaxCall) extraTimeToWait += baseTimeToWait;
                                        window[item.feature](item.param ? item.param : null); //the first parameter must be an URL
                                        executedFunction = true;
                                    }
                                    else {
                                        remainClicks.push(item);
                                    }
                                }
                                else {
                                    remainClicks.push(item);
                                }
                            }
                        }
                        catch (er) {
                            //
                        }
                    });

                if (remainClicks.length > 0) {
                    //save the missing navigation
                    currentTab = lastTab;
                    currentClicks = remainClicks;
                    saveState();
                }
                else {
                    forgetLastState();

                    var timeout = (executedFunction ? baseTimeToWait * 3 : baseTimeToWait) + extraTimeToWait * 50; //*50 because the dialogs
                    setTimeout(function () { //for the form partial views calls
                        if (lastHtmlSaved !== null && lastHtmlSaved !== "" && htmlToRestore !== null && htmlToRestore !== "" && $(htmlToRestore).length > 0)
                            $(htmlToRestore).html(lastHtmlSaved);

                        resetPage();
                    }, timeout);
                }
            }
        }, 50);
    };

    return {
        LeavePageEvents: leavePageEvents,
        SetLeavePageEvent: function (event) {
            setLeavePageEvent(event);
        },
        UnbindLeavePageEvent: function (event) {
            if (leavePageEvents) {
                if (event) {
                    if (leavePageEvents.indexOf(event) > -1)
                        leavePageEvents.splice(leavePageEvents.indexOf(event), 1);
                }
                else
                    leavePageEvents.pop();
            }
        },
        BindLeavePageEvent: bindLeavePageEvent,

        AddPageClick: addPageClick,
        CancelLastPageClick: cancelLastPageClick,
        AddTabClick: setTabClick,

        SavePage: savePage,
        ResetPage: resetPage,
        LoadPage: loadPage,
        LoadPartialPage: loadPartialPage,

        LoadPlatform: function ()
        {
            if (localStorage[loginStateId]) {
                loginWasLast = localStorage[loginStateId].toLowerCase() === "true";
                localStorage.removeItem(loginStateId);
            }
            else
                loginWasLast = false;

            if (loginWasLast) {
                loadLastState();
                if (lastUrl && lastUrl !== "" && window.location.pathname + window.location.search !== lastUrl) 
                    window.location.href = lastUrl;
            }
            loginWasLast = false;
        },
        BeginLoginState: function (url) {
            if (url)
                loginPage = url;
            else
                loginPage = window.location.href;
            loginWasLast = true;

            if (localStorage[loginStateId]) 
                localStorage.removeItem(loginStateId);

            localStorage[loginStateId] = loginWasLast;
        },

        CleanState: function (url) {
            resetPageState();
            
            if (url)
                window.location.href = url;
        },
        LogOut: function (url)
        {
            resetPageState();

            if (url)
                window.location.href = url;
        }
    };
})();
