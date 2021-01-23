// import chai for testing
import chai from 'chai';

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import { Preparable } from "../src/internal/preparable.js";

// import the Adapter to test error events bubble
import { Adapter } from "../src/internal/adapter.js";

// set-up spec testing feature-set
describe("Preparable ~ from ~ freo", function () {

    it("should enqueue function for later via onReady", function (done) {
        // count number of calls
        let called = 0;
        // create a new instance...
        const preparable = new Preparable();
        // get the scope value from the instance
        chai.expect(preparable.toString()).to.equal("[object Preparable]");
        // add a method to the queuedFns queue
        preparable.onReady(() => called++);
        // expect the fn to be queued but not called
        chai.expect(called).to.equal(0);
        // single item is queued
        chai.expect(preparable._queuedFns.length).to.equal(1);

        // complete test with done
        done();
    });

    it("should throw if provided anything but a function to onReady", function (done) {
        // create a new instance...
        const preparable = new Preparable();
        // onReady with a string should throw
        try {
            // add a method to the queuedFns queue
            preparable.onReady("throw");
        } catch (e) {
            chai.expect(e.toString()).to.equal("TypeError: fn must be a function");

            // complete test with done
            done();
        }
    });

    it("should call enqueued functions ready", function (done) {
        // count number of calls
        let called = 0;
        // create a new instance...
        const preparable = new Preparable();
        // add a method to the queuedFns queue
        preparable.onReady(() => called++);
        // expect the fn to be queued but not called
        chai.expect(called).to.equal(0);
        // make the preparable instance ready
        preparable.ready();
        // fn is called
        chai.expect(called).to.equal(1);
        // no items are queued
        chai.expect(preparable._queuedFns.length).to.equal(0);
        // state is now marked as isReady
        chai.expect(preparable._isReady).to.equal(true);

        // complete test with done
        done();
    });

    it("should call functions immediately if isReady", function (done) {
        // count number of calls
        let called = 0;
        // create a new instance...
        const preparable = new Preparable();
        // make the preparable instance ready
        preparable.ready();
        // no items are queued
        chai.expect(preparable._queuedFns.length).to.equal(0);
        // state is now marked as isReady
        chai.expect(preparable._isReady).to.equal(true);
        // add a method to the queuedFns queue
        preparable.onReady(() => called++);
        // calling ready again has no effect (onReady methods are already off the queue)
        preparable.ready();
        // fn is called
        chai.expect(called).to.equal(1);
        // no items are queued
        chai.expect(preparable._queuedFns.length).to.equal(0);
        // state is now marked as isReady
        chai.expect(preparable._isReady).to.equal(true);
        
        // complete test with done
        done();
    });

    it("should be preparable given a prepare step via options", function (done) {
        // has the preparation been called
        let prepared = false;
        // create a new instance...
        new Preparable({}, [], true,
            // add a prepartion step to fill the target object (this will be called synchronously)
            function (ready) {
                // check that the step was called
                prepared = true;
                // complete the prepartion (synchronously)
                ready()
            }
        );
        // * check that preparation was called
        chai.expect(prepared).to.equal(true);

        // complete test with done
        done();
    });

    it("should be preparable given a prepare step via options which returns a Promise", function (done) {
        // has the preparation been called
        let prepared = false;
        // create a new instance...
        const preparable = new Preparable({}, [], true,
            // add a prepartion step to fill the target object (this will be called synchronously)
            function () {

                // return a promise from within the prepare step
                return new Promise((resolve) => {
                    // check that the step was called
                    prepared = true;
                    // complete the prepartion (synchronously)
                    resolve()
                });
            }
        );
        // wait for ready
        preparable.onReady(() => {
            // * check that preparation was called
            chai.expect(prepared).to.equal(true);

            // complete test with done
            done();
        });
    });

    it("should be preparable given a prepare step via options which returns a Promise which rejects (and logs error)", function (done) {
        // record any errors thrown by construction
        const log = [];
        // has the preparation been called
        let prepared = false;
        // create a new instance...
        const preparable = new Preparable({}, [new Adapter(undefined, undefined, (err) => {
            // record errors
            log.push(err);
        })], true,
            // add a prepartion step to fill the target object (this will be called synchronously)
            function () {

                // return a promise from within the prepare step
                return new Promise((resolve, reject) => {
                    // check that the step was called
                    prepared = true;
                    // complete the prepartion (synchronously)
                    reject("Something went wrong")
                });
            }
        );
        // wait for ready
        preparable.onReady(() => {
            // * check that preparation was called
            chai.expect(prepared).to.equal(true);
            // expect a single error on the log
            chai.expect(log.length).to.equal(1);
            // expect log to hold error
            chai.expect(log[0].toString()).to.equal("Something went wrong");

            // complete test with done
            done();
        });
    });


    it("should wait on parents onReady", function (done) {
        // enqueue on parent
        let enqueued = [];
        // create a parent that can be waited on
        const parent = {
            // pick up adapters from the parent in the child
            _adapters: [],
            onReady: (fn) => {
                enqueued.push(fn)
            },
            ready: () => {
                enqueued.map((fn) => {
                    fn();
                });
            }
        }
        // create a new instance...
        const preparable1 = new Preparable(parent, [], true);
        // ready the parent to ready the preparable
        parent.ready();
        // done onReady
        preparable1.onReady(() => {
            // create a new instance...
            const preparable2 = new Preparable(parent, [], true, false);
            // ready the parent to ready the preparable
            parent.ready();
            // done onReady
            preparable2.onReady(() => {
                
                // complete test with done
                done();
            });
            // call ready manually
            preparable2.ready();
        });
    });

});
