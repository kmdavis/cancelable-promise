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
    const IS_CANCELED = Symbol("isCanceled");
    const IS_REJECTED = Symbol("isRejected");
    const IS_RESOLVED = Symbol("isResolved");
    const ON_CANCEL = Symbol("onCancel");
    const INTERNAL_PROMISE = Symbol("internalPromise");

    function fnWrapper(fn) {
        return fn ? (...args) => this[IS_CANCELED] ? undefined : fn(...args) : undefined;
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
    class CancelablePromise /* extends Promise */ {
        constructor(arg) {
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
            this[INTERNAL_PROMISE].then(() => {
                this[IS_RESOLVED] = !this[IS_CANCELED];
            }, () => {
                this[IS_REJECTED] = !this[IS_CANCELED];
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
        then(onResolved, onRejected, onCanceled) {
            return CancelablePromise.race([this[INTERNAL_PROMISE].then(fnWrapper.call(this, onResolved), fnWrapper.call(this, onRejected)), onCanceled && this.canceled(onCanceled)]);
        }

        /**
         * Attaches a callback for only the rejection of the {CancelablePromise}.
         *
         * @param  {Function} onRejected  The callback to execute when the {CancelablePromise} is rejected.
         * @return {CancelablePromise} for the completion of the callback.
         */
        catch(onRejected) {
            return new CancelablePromise(this[INTERNAL_PROMISE].catch(fnWrapper.call(this, onRejected)));
        }

        /**
         * Attaches a callback for any fulfillment of the {CancelablePromise}.
         *
         * @param  {Function} fn  The callback to execute when the {CancelablePromise} is fulfilled.
         * @return {CancelablePromise} for the completion of the callback.
         */
        finally(fn) {
            return this.then(fn, fn, fn);
        }

        /**
         * Cancel the {CancelablePromise}
         */
        cancel() {
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

        /**
         * Attaches a callback for only the cancelation of the {CancelablePromise}.
         *
         * @param  {Function} onCanceled  The callback to execute when the {CancelablePromise} is canceled.
         * @return {CancelablePromise} for the completion of the callback.
         */
        canceled(onCanceled) {
            if (this[IS_CANCELED] && !this[ON_CANCEL].length) {
                return CancelablePromise.try(onCanceled);
            }
            let resolve;
            const p = new CancelablePromise(r => {
                resolve = r;
            }).then(onCanceled);
            this[ON_CANCEL].push(resolve);
            return p;
        }

        /**
         * Is the {CancelablePromise} canceled?
         *
         * @return {Boolean}
         */
        isCanceled() {
            return this[IS_CANCELED];
        }

        /**
         * Is the {CancelablePromise} resolved?
         *
         * @return {Boolean}
         */
        isResolved() {
            return this[IS_RESOLVED];
        }

        /**
         * Is the {CancelablePromise} rejected?
         *
         * @return {Boolean}
         */
        isRejected() {
            return this[IS_REJECTED];
        }

        /**
         * Creates a {CancelablePromise} that is resolved with an array of results when all
         * of the provided {Promise}s resolve, or rejected when any {Promise} is
         * rejected, or canceled when any {CancelablePromise} is canceled.
         *
         * @param  {Mixed[]} values  An array of {Promise}s, {CancelablePromise}s, and/or other values.
         * @return {CancelablePromise.<Mixed[]>}
         */
        static all(values = []) {
            const CancelablePromises = values.map(p => p instanceof Promise ? new CancelablePromise(p) : p);
            const result = new CancelablePromise(Promise.all(CancelablePromises));
            // if the parent is cancelled, cancel all of the children
            result.canceled(() => CancelablePromises.forEach(p => p instanceof CancelablePromise && p.cancel()));
            // if any child is cancelled, cancel the parent also
            // (which will then cancel the other children)
            CancelablePromises.forEach(p => p instanceof CancelablePromise && p.canceled(() => result.cancel()));
            return result;
        }

        /**
         * Cancel a promise
         *
         * @param {CancelablePromise} promise
         */
        static cancel(promise) {
            if (promise instanceof CancelablePromise) {
                promise.cancel();
            }
        }

        /**
         * Creates a {CancelablePromise} that is resolved or rejected when any of the provided
         * Promises are resolved or rejected.
         *
         * @param  {Mixed} values  An array of {Promise}s, {CancelablePromise}s, and/or other values.
         * @return {CancelablePromise}
         */
        static race(values = []) {
            return new CancelablePromise(Promise.race(values));
            // NOTE: unlike `all`, `race` doesn't cancel children
        }

        /**
         * Creates a new rejected {CancelablePromise} for the provided reason.
         *
         * @param  {Error} reason  The reason {CancelablePromise} was rejected.
         * @return {CancelablePromise}
         */
        static reject(reason) {
            const p = new CancelablePromise(Promise.reject(reason));
            p[IS_REJECTED] = true;
            return p;
        }

        /**
         * Creates a new resolved {CancelablePromise} for the provided value.
         *
         * @param  {Mixed} value
         * @return {CancelablePromise}
         */
        static resolve(value) {
            const p = new CancelablePromise(Promise.resolve(value));
            if (!(value instanceof Promise || value instanceof CancelablePromise)) {
                p[IS_RESOLVED] = true;
            }
            return p;
        }

        /**
         * Calls the promised function in a future turn.
         *
         * @param  {Function} fn
         * @return {CancelablePromise}
         */
        static try(fn) {
            return Promise.try ? new CancelablePromise(Promise.try(fn)) : new CancelablePromise(Promise.resolve().then(fn));
        }
    }
    exports.default = CancelablePromise;
});
