(function (global) {
    /**
     * A selector rule type-definition.
     * 
     * @typedef {{
     *  selector: string,
     *  callback: !Function
     * }}
     */
    var SelectorRule;

    /**
     * MutationObserverConstructor
     * 
     * @type {MutationObserver|undefined}
     */
    var MutationObserverCtor = MutationObserver || window['WebKitMutationObserver'];

    /**
     * A boolean value indiciates whether the
     * browser is supported.
     * 
     * @type {!boolean}
     */
    var isBrowserSupported = (typeof MutationObserverCtor !== "undefined");
    var elemetPrototype = Element.prototype;
    /**
     * matchesSelector pollyfill.
     * 
     * @type {!Function}
     */
    var matchesSelector = elemetPrototype.matches || elemetPrototype.matchesSelector || elemetPrototype.mozMatchesSelector || elemetPrototype.msMatchesSelector;


    /**
     * A empty-function to prevent any errors
     * when browser is not supported.
     */
    function noop() { }



    /**
 * Iterate over array
 * 
 * @param {!Array.<*>} arr 
 * @param {!Function} callback 
 */
    function forEach(arr, callback) {
        return Array.prototype.forEach.call(arr, callback);
    }

    /**
     * A set of selectors to match
     * 
     * @type {Array.<!SelectorRule>|undefined}
     */
    var addedNodesSelectors = [];

    /**
     * A set of removed nodes selectors.
     * 
     * @type {Array.<!SelectorRule>|undefined}
     */
    var removedNodesSelectors = [];

    /**
     * MutationObserver instance
     */
    var observer = (function () {

        /**
         * A boolean value indiciates whether
         * the mutation observer is connected
         * 
         * @type {!boolean}
         */
        var isObserving = false;

        /**
         * 
         * @type {MutationObserver|undefined}
         */
        var observer;

        /**
         * Return 
         * 
         * @param {NodeList} nodes 
         * @param {!Array.<!SelectorRule>} selectorRules 
         * @return {!Array.<!Node>}
         */
        function handleAddedOrRemovedElements(nodes, selectorRules) {
            forEach(nodes, function (node) {
                if (node.nodeType === Node.ELEMENT_NODE) {

                    forEach(selectorRules, function (selectorRule) {
                        if (matchesSelector.call(node, selectorRule.selector)) {
                            selectorRule.callback.call(node);
                        }
                    });
                    if (node.childNodes.length > 0) {
                        handleAddedOrRemovedElements(node.childNodes, selectorRules);
                    }
                }
            });
        }

        /**
         * Handle mutations
         * 
         * @param {!Array.<!MutationRecord>} mutations 
         */
        function handleMutations(mutations) {
            forEach(mutations, function (mutation) {
                handleAddedOrRemovedElements(mutation.addedNodes, addedNodesSelectors);
                handleAddedOrRemovedElements(mutation.removedNodes, removedNodesSelectors);
            });
        }
        return {
            isObserving: function () {
                return isObserving;
            },
            observe: function () {
                observer = new MutationObserverCtor(handleMutations);
                observer.observe(document.documentElement, {
                    subtree: true,
                    childList: true
                });
                isObserving = true;
            }
        }
    })();

    /**
     * Determine whether a given selector
     * is valid.
     * 
     * @param {*} selector 
     */
    function isValidSelector(selector) {
        try {
            document.querySelector(selector);
            return true;
        }
        catch (err) {
            return false;
        }
    }

    /**
     * Determine whether a given argument
     * is a function.
     * 
     * @param {*} func 
     */
    function isFunction(func) {
        return typeof func === "function";
    }

    /**
     * Add watch rule
     * 
     * @param {!string} selector 
     * @param {!Function} callback 
     * @param {!Array.<Object>} rulesArray 
     */
    function addWatchRule(selector, callback, rulesArray) {
        if (!observer.isObserving()) {
            observer.observe();
        }
        if (isValidSelector(selector) && isFunction(callback)) {
            rulesArray.push({
                selector: selector,
                callback: callback
            })
        }
    }

    if (!global['urCapture']) {
        global['urCapture'] = (function () {
            if (isBrowserSupported) {
                return {
                    'watchForAddedElements': function (selector, callback) {
                        addWatchRule(selector, callback, addedNodesSelectors);
                    },
                    'watchForRemovedElements': function (selector, callback) {
                        addWatchRule(selector, callback, removedNodesSelectors);
                    }
                }
            }
            return {
                'watchForAddedElements': noop,
                'watchForRemovedElements': noop,
            }
        })();
    }


})(window);