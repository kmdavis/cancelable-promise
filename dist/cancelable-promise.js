(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.CancelablePromise = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var IS_CANCELED = Symbol("isCanceled");
    var IS_REJECTED = Symbol("isRejected");
    var IS_RESOLVED = Symbol("isResolved");
    var ON_CANCEL = Symbol("onCancel");
    var INTERNAL_PROMISE = Symbol("internalPromise");

    function fnWrapper(fn) {
        var _this = this;

        return fn ? function () {
            return _this[IS_CANCELED] ? undefined : fn.apply(undefined, arguments);
        } : undefined;
    }

    /**
     * Promise-like class that adds cancelability to ES6 Promises.
     *
     * @example
     * const p1 = CancelablePromise.resolve("HI");
     * p1.then(console.log); // logs "HI"
     *
     * const p2 = CancelablePromise.resolve("NOPE")
     * p2.cancel();
     * p2.then(console.log); // will NOT log
     *
     * const p3 = CancelablePromise.resolve("HEYA")
     * p3.canceled(() => console.log("I GOT CANCELLED"));
     * p3.cancel(); // will log -----^^
     */

    var CancelablePromise /* extends Promise */ = function () {
        function CancelablePromise(arg) {
            var _this2 = this;

            _classCallCheck(this, CancelablePromise);

            this[IS_CANCELED] = false;
            this[ON_CANCEL] = [];
            if (arg instanceof CancelablePromise) {
                return arg;
            }
            if (arg instanceof Promise) {
                this[INTERNAL_PROMISE] = arg;
            } else if (arg instanceof Function) {
                this[INTERNAL_PROMISE] = new Promise(arg);
            } else {
                this[INTERNAL_PROMISE] = Promise.resolve(arg);
            }
            this[INTERNAL_PROMISE].then(function () {
                _this2[IS_RESOLVED] = !_this2[IS_CANCELED];
            }, function () {
                _this2[IS_REJECTED] = !_this2[IS_CANCELED];
            });
        }

        /**
         * Attaches callbacks for the resolution, rejection and/or cancelation of the {CancelablePromise}.
         *
         * @param  {Function} [onResolved]  The callback to execute when the {CancelablePromise} is resolved.
         * @param  {Function} [onRejected]  The callback to execute when the {CancelablePromise} is rejected.
         * @param  {Function} [onCanceled]  The callback to execute when the {CancelablePromise} is canceled.
         * @return {CancelablePromise} for the completion of which ever callback is executed.
         */


        _createClass(CancelablePromise, [{
            key: "then",
            value: function then(onResolved, onRejected, onCanceled) {
                return CancelablePromise.race([this[INTERNAL_PROMISE].then(fnWrapper.call(this, onResolved), fnWrapper.call(this, onRejected)), onCanceled && this.canceled(onCanceled)]);
            }
        }, {
            key: "catch",
            value: function _catch(onRejected) {
                return new CancelablePromise(this[INTERNAL_PROMISE].catch(fnWrapper.call(this, onRejected)));
            }
        }, {
            key: "finally",
            value: function _finally(fn) {
                return this.then(fn, fn, fn);
            }
        }, {
            key: "cancel",
            value: function cancel() {
                if (!this[IS_CANCELED] && !this[IS_RESOLVED] && !this[IS_REJECTED]) {
                    this[IS_CANCELED] = true;
                    while (this[ON_CANCEL].length) {
                        try {
                            this[ON_CANCEL].shift()();
                        } catch (e) {
                            console.error(e); // eslint-disable-line no-console
                        }
                    }
                }
            }
        }, {
            key: "canceled",
            value: function canceled(onCanceled) {
                if (this[IS_CANCELED] && !this[ON_CANCEL].length) {
                    return CancelablePromise.try(onCanceled);
                }
                var resolve = void 0;
                var p = new CancelablePromise(function (r) {
                    resolve = r;
                }).then(onCanceled);
                this[ON_CANCEL].push(resolve);
                return p;
            }
        }, {
            key: "isCanceled",
            value: function isCanceled() {
                return this[IS_CANCELED];
            }
        }, {
            key: "isResolved",
            value: function isResolved() {
                return this[IS_RESOLVED];
            }
        }, {
            key: "isRejected",
            value: function isRejected() {
                return this[IS_REJECTED];
            }
        }], [{
            key: "all",
            value: function all() {
                var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

                var CancelablePromises = values.map(function (p) {
                    return p instanceof Promise ? new CancelablePromise(p) : p;
                });
                var result = new CancelablePromise(Promise.all(CancelablePromises));
                // if the parent is cancelled, cancel all of the children
                result.canceled(function () {
                    return CancelablePromises.forEach(function (p) {
                        return p instanceof CancelablePromise && p.cancel();
                    });
                });
                // if any child is cancelled, cancel the parent also
                // (which will then cancel the other children)
                CancelablePromises.forEach(function (p) {
                    return p instanceof CancelablePromise && p.canceled(function () {
                        return result.cancel();
                    });
                });
                return result;
            }
        }, {
            key: "cancel",
            value: function cancel(promise) {
                if (promise instanceof CancelablePromise) {
                    promise.cancel();
                }
            }
        }, {
            key: "race",
            value: function race() {
                var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

                return new CancelablePromise(Promise.race(values));
                // NOTE: unlike `all`, `race` doesn't cancel children
            }
        }, {
            key: "reject",
            value: function reject(reason) {
                var p = new CancelablePromise(Promise.reject(reason));
                p[IS_REJECTED] = true;
                return p;
            }
        }, {
            key: "resolve",
            value: function resolve(value) {
                var p = new CancelablePromise(Promise.resolve(value));
                if (!(value instanceof Promise || value instanceof CancelablePromise)) {
                    p[IS_RESOLVED] = true;
                }
                return p;
            }
        }, {
            key: "try",
            value: function _try(fn) {
                return Promise.try ? new CancelablePromise(Promise.try(fn)) : new CancelablePromise(Promise.resolve().then(fn));
            }
        }]);

        return CancelablePromise;
    }();

    exports.default = CancelablePromise;
});
