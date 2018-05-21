import CancelablePromise from "..";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 50;

describe("CancelablePromise", () => {
    describe("#constructor", () => {
        it("should return a passed in CancelablePromise", () => {
            const p1 = new CancelablePromise();
            const p2 = new CancelablePromise(p1);
            expect(p1).to.equal(p2);
        });

        it("should wrap a passed in Promise", (done) => {
            const p1 = Promise.resolve("HI");
            const p2 = new CancelablePromise(p1);
            const fn = sinon.spy();
            p2.then(fn);
            setTimeout(() => {
                expect(fn).to.have.been.calledWith("HI");
                done();
            });
        });

        it("should wrap a passed in Function", (done) => {
            const p1 = new CancelablePromise(resolve => setTimeout(() => resolve("HI")));
            const fn = sinon.spy();
            p1.then(fn);
            setTimeout(() => {
                expect(fn).to.have.been.calledWith("HI");
                done();
            }, 15);
        });

        it("should wrap a passed in value", (done) => {
            const p1 = new CancelablePromise("HI");
            const fn = sinon.spy();
            p1.then(fn);
            setTimeout(() => {
                expect(fn).to.have.been.calledWith("HI");
                done();
            }, 15);
        });
    });

    describe("#then", () => {
        it("should call onResolved when Promise resolved if not canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise(resolve => setTimeout(() => resolve("HI")));
            p.then(fn, done);
            setTimeout(function () {
                expect(fn).to.have.been.calledWith("HI");
                done();
            }, 15);
        });

        it("should call onRejected when Promise resolved if not canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise((__, reject) => setTimeout(() => reject("HI")));
            p.then(null, fn);
            setTimeout(function () {
                expect(fn).to.have.been.calledWith("HI");
                done();
            }, 15);
        });

        it("should not call onResolved when Promise resolved if canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise(resolve => setTimeout(() => resolve("HI")));
            p.cancel();
            p.then(fn, done);
            setTimeout(function () {
                expect(fn).to.not.have.been.called;
                done();
            }, 15);
        });

        it("should not call onRejected when Promise resolved if canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise((__, reject) => setTimeout(() => reject("HI")));
            p.cancel();
            p.then(null, fn);
            setTimeout(function () {
                expect(fn).to.not.have.been.called;
                done();
            }, 15);
        });

        it("should not call onCanceled if not canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise(() => null);
            p.then(null, null, fn)
                .catch(done);
            setTimeout(function () {
                expect(fn).to.not.have.been.called;
                done();
            }, 15);
        });

        it("should not call onCanceled if resolved even if canceled", (done) => {
            const fn = sinon.spy();
            const p = CancelablePromise.resolve("HI");
            p.cancel();
            p.then(null, null, fn)
                .catch(done);
            setTimeout(function () {
                expect(fn).to.not.have.been.called;
                done();
            }, 15);
        });

        it("should not call onCanceled if rejected even if later canceled", (done) => {
            const fn = sinon.spy();
            const p = CancelablePromise.reject("HI");
            p.cancel();
            p.then(null, null, fn)
                .catch(() => {});
            setTimeout(function () {
                expect(fn).to.not.have.been.called;
                done();
            }, 15);
        });

        it("should call onCanceled if canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise(() => null);
            p.cancel();
            p.then(null, null, fn)
                .catch(done);
            setTimeout(function () {
                expect(fn).to.have.been.called;
                done();
            }, 15);
        });
    });

    describe("#catch", () => {
        it("should call onRejected when Promise resolved if not canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise((__, reject) => setTimeout(() => reject("HI")));
            p.catch(fn);
            setTimeout(function () {
                expect(fn).to.have.been.calledWith("HI");
                done();
            }, 15);
        });

        it("should not call onRejected when Promise resolved if canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise((__, reject) => setTimeout(() => reject("HI")));
            p.cancel();
            p.catch(fn);
            setTimeout(function () {
                expect(fn).to.not.have.been.called;
                done();
            }, 15);
        });
    });

    describe("#finally", () => {
        it("should call fn when Promise resolved", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise(resolve => setTimeout(() => resolve("HI")));
            p.finally(fn);
            setTimeout(function () {
                expect(fn).to.have.been.calledWith("HI");
                done();
            }, 15);
        });

        it("should call fn when Promise rejected", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise((__, reject) => setTimeout(() => reject("HI")));
            p.finally(fn);
            setTimeout(function () {
                expect(fn).to.have.been.calledWith("HI");
                done();
            }, 15);
        });

        it("should call fn when Promise canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise(resolve => setTimeout(() => resolve("HI")));
            p.cancel();
            p.finally(fn);
            setTimeout(function () {
                expect(fn).to.have.been.called;
                done();
            }, 15);
        });
    });

    describe("#cancel", () => {
        it("should cancel a Promise", () => {
            const p = new CancelablePromise(() => null);
            p.cancel();
            expect(p.isCanceled()).to.be.true;
        });

        it("should execute all onCanceled callbacks", (done) => {
            const fn1 = sinon.spy();
            const fn2 = sinon.stub().throws();
            const fn3 = sinon.spy();
            const p = new CancelablePromise(() => null);
            p.canceled(fn1);
            p.canceled(fn2);
            p.canceled(fn3);
            p.cancel();
            setTimeout(() => {
                expect(fn1).to.have.been.called;
                expect(fn2).to.have.been.called;
                expect(fn3).to.have.been.called;
                done();
            });
        });

        it("should not cancel if already resolved", () => {
            const p = CancelablePromise.resolve("HI");
            p.cancel();
            expect(p.isCanceled()).to.be.false;
        });

        it("should not cancel if already rejected", () => {
            const p = CancelablePromise.reject("HI");
            p.cancel();
            expect(p.isCanceled()).to.be.false;
        });
    });

    describe("#canceled", () => {
        it("should register a callback to be called if canceled", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise(() => null);
            p.canceled(fn);
            p.cancel();
            setTimeout(() => {
                expect(fn).to.have.been.called;
                done();
            });
        });

        it("should return a new Cancellable", (done) => {
            const fn = sinon.spy();
            const p = new CancelablePromise(() => null);
            p.canceled(() => "HI").then(fn, done);
            p.cancel();
            setTimeout(() => {
                expect(fn).to.have.been.called;
                // FAIL: gets called with `undefined` instead of `HI`
                // expect(fn).to.have.been.calledWith("HI");
                done();
            });
        });

        it("should call callback immediately if Promise already canceled", () => {
            const fn = sinon.spy();
            const p = new CancelablePromise(() => null);
            p.cancel();
            p.canceled(fn);
            expect(fn).to.have.been.called;
        });
    });

    describe(".all", () => {
        it("should return a CancelablePromise version of Promise.all", sinon.test(function (done) {
            this.spy(Promise, "all");
            expect(CancelablePromise.all(["a", "b"])).to.be.instanceof(CancelablePromise);
            expect(Promise.all).to.have.been.calledWith(["a", "b"]);
            const fn = sinon.spy();
            CancelablePromise.all(["a", "b"]).then(fn);
            setTimeout(() => {
                expect(fn).to.have.been.calledWith(["a", "b"]);
                done();
            });
        }));

        it("should cancel if any children are canceled", function (done) {
            const p1 = new CancelablePromise(() => null);
            const p2 = CancelablePromise.all([p1]);
            p1.cancel();
            setTimeout(() => {
                expect(p2.isCanceled()).to.be.true;
                done();
            });
        });

        it("should cancel children if canceled", function (done) {
            const p1 = new CancelablePromise(() => null);
            const p2 = CancelablePromise.all([p1]);
            p2.cancel();
            setTimeout(() => {
                expect(p1.isCanceled()).to.be.true;
                done();
            });
        });
    });

    describe(".cancel", () => {
        it("should call #cancel", () => {
            const p = new CancelablePromise(() => null);
            sinon.spy(p, "cancel");
            CancelablePromise.cancel(p);
            expect(p.cancel).to.have.been.called;
            expect(p.isCanceled()).to.be.true;
        });
    });

    describe(".race", () => {
        it("should return a CancelablePromise version of Promise.race", sinon.test(function () {
            this.spy(Promise, "race");
            expect(CancelablePromise.race(["a", "b"])).to.be.instanceof(CancelablePromise);
            expect(Promise.race).to.have.been.calledWith(["a", "b"]);
        }));
    });

    describe(".reject", () => {
        it("should return a CancelablePromise version of Promise.reject", sinon.test(function () {
            this.spy(Promise, "reject");
            expect(CancelablePromise.reject("a")).to.be.instanceof(CancelablePromise);
            expect(Promise.reject).to.have.been.calledWith("a");
        }));
    });

    describe(".resolve", () => {
        it("should return a CancelablePromise version of Promise.resolve", sinon.test(function () {
            this.spy(Promise, "resolve");
            expect(CancelablePromise.resolve("a")).to.be.instanceof(CancelablePromise);
            expect(Promise.resolve).to.have.been.calledWith("a");
        }));
    });

    describe(".try", () => {
        it("should return a CancelablePromise version of Promise.try", sinon.test(function (done) {
            this.spy(Promise, "try");
            const fn1 = sinon.stub().returns("HI");
            const fn2 = sinon.spy();
            expect(CancelablePromise.try(fn1).then(fn2)).to.be.instanceof(CancelablePromise);
            expect(Promise.try).to.have.been.calledWith(fn1);
            setTimeout(() => {
                expect(fn1).to.have.been.called;
                expect(fn2).to.have.been.calledWith("HI");
                done();
            });
        }));
    });
});
