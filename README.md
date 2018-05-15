# Cancelable Promise
> Promise-like class that adds cancelability to ES6 Promises.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

A `CancelablePromise` is a `Promise` that can be canceled so that the `onResolved` & `onRejected` callbacks don't get called. Can be used to cancel async operations that are no longer relevant (e.g. a `fetch` initiated by a `React` component that has since been unmounted).

## Installation

```sh
npm install @kmdavis/cancelable-promise
```

## Usage

```js
import CancelablePromise from "@kmdavis/cancelable-promise";

const myPromise = new CancelablePromise((resolve) => {
    // This Promise will automatically resolve in 5 seconds...
    // ...unless it gets canceled first!
    setTimeout(() => {
        console.log("Gonna try to resolve");
        resolve();
    }, 5000);
});

setTimeout(
    // Cancel the Promise
    () => {
        console.log("Gonna try to cancel");
        myPromise.cancel()
    },
    // At some random point between 4 and 6 seconds
    Math.floor(Math.random() * 2000) + 4000
);

myPromise.then(
    () => console.log("myPromise was resolved"),
    () => console.log("myPromise was rejected"),
    () => console.log("myPromise was canceled")
);

// Who do you think will win?
```

In addition to all of the public methods of an ES6 `Promise` (`then`, `catch`, `finally`, `resolve`, `reject`, `try`, `all`, & `race`) a `CancelablePromise` extends `then` and `all` and also has `cancel`, `canceled`, `isCanceled`, `isResolved`, & `isRejected`

#### then (onResolved, onRejected, onCanceled) : CancelablePromise

Attaches callbacks for the resolution, rejection and/or cancelation of the `CancelablePromise`.

#### static all (listOfPromises) : CancelablePromise

Creates a `CancelablePromise` that is resolved with an array of results when all of the provided `Promise`s resolve, or rejected when any `Promise` is rejected, or canceled when any `CancelablePromise` is canceled.

#### cancel () : void

Cancel a CancelablePromise.

#### static cancel (promise) : void

Cancel a CancelablePromise.

#### canceled (onCanceled) : CancelablePromise

Attaches a callback for the cancelation of the `CancelablePromise`.

#### isCanceled () : bool

Is the `CancelablePromise` canceled?

#### isResolved () : bool

Is the `CancelablePromise` resolved?

#### isRejected () : bool

Is the `CancelablePromise` rejected?

## Development setup

```sh
npm install
npm test
```

## Release History

* 0.1.0
    * Initial public release

## Meta

Kevan Davis <kevan.davis@me.com>

Distributed under the BSD license.

[https://github.com/kmdavis/cancelable-promise](https://github.com/kmdavis/cancelable-promise/)

## Contributing

1. Fork it (<https://github.com/kmdavis/cancelable-promise/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/@kmdavis/cancelable-promise.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@kmdavis/cancelable-promise
[npm-downloads]: https://img.shields.io/npm/dm/@kmdavis/cancelable-promise.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/kmdavis/cancelable-promise/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/kmdavis/cancelable-promise
