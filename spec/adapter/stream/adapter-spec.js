// import chai for testing
import chai from 'chai';

// create StreamAdapter against a Writable instance
import { Writable } from "../../../src/internal/writable.js";

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import { StreamAdapter } from "../../../src/internal/adapter/stream/adapter.js";

// test against Subjects
import { Subject } from '@gdixon/fre';

// set-up spec testing feature-set
describe("StreamAdapter ~ from ~ freo/adapter/stream", function () {

    // set up the test environment (one watcher set against an Object)
    const reset = (done, state) => {
        // check for external ref to counter
        state = (state ? state : {});
        // reset the counter (also updates originalCounterRef by reference if supplied - this allows external to spy value as its being set)
        state["counter"] = (typeof state["counter"] == "undefined" ? 0 : state["counter"]);
        // set-up the streamable against a raw object for each test
        //  - prop0 = obj = the target object we want to make functionally reactive
        //  - prop1 = key = the key (dot.delim) we are pointing at in the obj with this streamable instance
        //  - prop2 = options = object of options & plugins to provide to the instance
        const streamable = new Writable({
            "scope": {
                a: 1
            }
        }, "", {
            adapters: [
                new StreamAdapter()
            ]
        });
        // watch for each emission on the observer stream and record the operation into the supplied state object (using raw:true in stream to get the whole message)
        streamable.stream({raw: true}).subscribe((message) => {
            // no message on first subscribe if noLastMessage
            if (message) {
                // incr the counter
                state["counter"] = (state["counter"] ? state["counter"] : 0) + 1;
                // record the command aspect of the message
                state["method"] = message.method;
                // record the key aspect of the message
                state["against"] = message.key;
                // record the data aspect of the message
                state["alteration"] = message.value;

                // close the async await method if supplied
                if (done) done();
            }
        });

        // return the subscribed instance (this test presumes that a lot of the internal mechanisms are functioning correctly)
        return streamable;
    };

    it("should directly pass .next() calls through the observerable stream", function (done) {
        // pass state object to the reset so that we can record how the state was changed after the call
        let state = {};
        // proxy done to close the watcher
        let test = reset(false, state);
        // clone the state
        state.before = test.raw();
        // push a message through the observable stream
        test.next({ method: "set", value: {}, key: "", response: true, skipMessage: true });
        // skipNotify can disable casting messages through notify fn
        chai.expect(state.counter).to.equal(0);
        // notify again to hit the reset streamable
        test.next({ method: "set", value: {}, key: "", response: true});
        // expect one invokation of the defined callback
        chai.expect(state.counter).to.equal(1);
        // expect the alterations object to be filled with before and after values
        chai.expect(JSON.stringify(state.before)).to.equal("{\"scope\":{\"a\":1}}");
        // this value is at the root - so we dont expect it to be deleted
        chai.expect(JSON.stringify(state.alteration)).to.equal("{}");
        // obj will not be altered
        chai.expect(JSON.stringify(test.raw(true))).to.equal("{\"scope\":{\"a\":1}}");

        // complete test with done
        done();
    });

    it("should pass .set() operations through the observerable stream", function (done) {
        // pass state object to the reset so that we can record how the state was changed after the call
        let state = {};
        // proxy done to close the watcher
        let test = reset(false, state);
        // clone the state
        state.before = test.raw();
        // set value against the observered instance
        //  - prop0 = obj = the value with which to replace the target
        test.set({
            different: [1, 2, 3]
        }, {creationMaxDepth: -1, replaceRoot: true});
        // expect one invokation of the defined callback
        chai.expect(state.counter).to.equal(1);
        // carrying out the same operation will not result in a second call to the stream
        test.set({
            different: [1, 2, 3]
        }, undefined, {creationMaxDepth: -1, replaceRoot: true});
        // expect one invokation of the defined callback
        chai.expect(state.counter).to.equal(1);
        // expect the alterations object to be filled with before and after values
        chai.expect(JSON.stringify(state.before)).to.equal("{\"scope\":{\"a\":1}}");
        chai.expect(JSON.stringify(state.alteration)).to.equal("{\"different\":[1,2,3]}");
        chai.expect(JSON.stringify(test.raw(true))).to.equal("{\"different\":[1,2,3]}");
        // complete test with done
        done();
    });

    it("should pass .delete() operations through the observerable stream", function (done) {
        // pass state object to the reset so that we can record how the state was changed after the call
        let state = {};
        // proxy done to close the watcher
        let test = reset(false, state);
        // clone the state
        state.before = test.raw();
        // delete this whole object from the holding
        test.delete();
        // expect one invokation of the defined callback
        chai.expect(state.counter).to.equal(1);
        // expect the alterations object to be filled with before and after values
        chai.expect(JSON.stringify(state.before)).to.equal("{\"scope\":{\"a\":1}}");
        // this value is at the root - so we dont expect it to be deleted
        chai.expect(JSON.stringify(state.alteration)).to.equal("{}");
        // this value is at the root - so we dont expect it to be deleted but we do expect it to be emptied
        chai.expect(JSON.stringify(test.raw())).to.equal("{}");

        // complete test with done
        done();
    });

    it("should allow the root of the stream to be controlled by the first target StreamAdapter it sees", function (done) {
        // count the number of messages
        let messaged = 0;
        // construct a streamable writable
        const writable = new Writable({
            "scope": {
                a: 1
            }
        });
        // start a streamable at known position
        const streamable = writable.get("scope.a", {
            adapters: [
                new StreamAdapter()
            ]
        });

        // subscribe an Observer to stream
        streamable.stream().subscribe((message) => {
            // if this was tested with a BehaviourSubject then it would get 1 first
            if (message === 1) chai.expect(message).to.equal(1);
            // only record the second hit
            if (message >= 2) {
                // mark the message happened synchronously
                messaged++;
            }
        });
        // set a value not covered by the the stream (but with the streamAdapter present)
        streamable.get("~different.b").set("no");
        // set the expected value
        streamable.set(2);
        // setting the same value wont hit the stream
        streamable.set(2);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);
        // set another message
        const setTo3 = streamable.set(3);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(2);
        // undo set to 3
        const undone_setTo3 = setTo3.undo();
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(3);
        // redo the undone message
        undone_setTo3.redo();
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(4);
        // setting the same value wont hit the stream
        streamable.set(2);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(5);
        // undo back to 2 again - shouldnt send a next
        setTo3.undo();
        // no messaged incr
        chai.expect(messaged).to.equal(5);
        
        // complete test with done
        done();
    });

    it("should allow errors to be pushed through and to stop the stream", function (done) {
        // count the number of messages
        let error = false, streamAdapter = false;
        // construct a streamable writable
        const writable = new Writable({
            "scope": {
                a: 1
            }
        });
        // start a streamable at known position
        const streamable = writable.get("scope.a", {
            adapters: [
                (streamAdapter = new StreamAdapter())
            ]
        });

        // subscribe an Observer to stream
        streamable.stream().subscribe(undefined, (e) => {
            error = e;
        });

        // emit error but dont let it hit the stream
        streamable.error(new Error("test"), {err: new Error("test"), skipMessage: true});

        // error didnt hit the stream
        chai.expect(streamAdapter._subject.closed).to.equal(false);

        // emit error through streamable (StreamAdapter aware)
        streamable.error(new Error("test"));

        // expect the error text to match
        chai.expect(error.toString()).to.equal("Error: test");

        // subject will be closed (and stopped ie not complete)
        chai.expect(streamAdapter._subject.closed).to.equal(true);
        chai.expect(streamAdapter._subject.isStopped).to.equal(true);
        
        // complete test with done
        done();
    });

    it("should allow the Stream to be unsubscribed from the associated Observable", function (done) {
        // count the number of messages
        let messaged = 0;
        // create an instance so we can unsubscribe it
        const streamAdapter = new StreamAdapter();
        // construct a streamable writable
        const streamable = new Writable({
            "scope": {
                a: 1
            }
        }, "scope.a", {
            adapters: [
                streamAdapter
            ]
        });

        // reference the stream position
        const stream = streamable.stream();

        // subscribe an Observer to stream
        stream.subscribe((message) => {
            // if this was tested with a BehaviourSubject then it would get 1 first
            if (message === 1) chai.expect(message).to.equal(1);
            // only record the second hit
            if (message === 2) {
                // exepct the message value set on the streams instance
                chai.expect(message).to.equal(2);
                // mark the message happened synchronously
                messaged++;
            }
        });
        // set the expected value
        streamable.set(2);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);

        // close all connections (manually without closing the streamAdapter)
        streamAdapter._unsubscribe();

        // carry out another set
        streamable.set(3);
        // expect messaged to be still equal 2
        chai.expect(messaged).to.equal(1);
        // subscribing to a closed stream will emit no messages
        stream.subscribe(() => {
            // mark the message happened synchronously
            messaged++;
        });
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);
        // carry out another set
        streamable.set(4);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);

        // complete test with done
        done();
    });

    it("should allow the Stream to be completed from the associated Observable", function (done) {
        // count the number of messages
        let messaged = 0;
        // create an instance so we can unsubscribe it
        const streamAdapter = new StreamAdapter();
        // construct a streamable writable
        const streamable = new Writable({
            "scope": {
                a: 1
            }
        }, "scope.a", {
            adapters: [
                streamAdapter
            ]
        });

        // reference the stream position
        const stream = streamable.stream();

        // subscribe an Observer to stream
        stream.subscribe((message) => {
            // if this was tested with a BehaviourSubject then it would get 1 first
            if (message === 1) chai.expect(message).to.equal(1);
            // only record the second hit
            if (message === 2) {
                // exepct the message value set on the streams instance
                chai.expect(message).to.equal(2);
                // mark the message happened synchronously
                messaged++;
            }
        });
        // set the expected value
        streamable.set(2);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);

        // close all connections (manually without closing the streamAdapter)
        streamAdapter._complete();

        // carry out another set
        streamable.set(3);
        // expect messaged to be still equal 2
        chai.expect(messaged).to.equal(1);
        // pulling a stream again will recreate the associated Observable (behaviourSubject)
        stream.subscribe(() => {
            // message will be locked to 2 and will only emit on subscribe
            messaged++;
        });
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(2);
        // carry out another set
        streamable.set(4);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(2);

        // complete test with done
        done();
    });

    it("should allow the Stream to be unsubscribed via the StreamAdapter", function (done) {
        // count the number of messages
        let messaged = 0;
        // create an instance so we can unsubscribe it
        const streamAdapter = new StreamAdapter();
        // construct a streamable writable
        const streamable = new Writable({
            "scope": {
                a: 1
            }
        }, "scope.a", {
            adapters: [
                streamAdapter
            ]
        });
        // pull a stream from the streamable
        streamable.stream().subscribe((message) => {
            // if this was tested with a BehaviourSubject then it would get 1 first
            if (message === 1) chai.expect(message).to.equal(1);
            // only record the second hit
            if (message === 2) {
                // exepct the message value set on the streams instance
                chai.expect(message).to.equal(2);
                // mark the message happened synchronously
                messaged++;
            }
        });
        // set the expected value
        streamable.set(2);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);

        // close all connections (and also close the streamAdapter)
        streamAdapter.unsubscribe();
        
        // carry out another set
        streamable.set(3);
        // expect messaged to be still equal 2
        chai.expect(messaged).to.equal(1);
        // pulling a stream again will recreate the associated Observable? But unsubscribe closed the StreamAdapter so no messages will arrive
        streamable.stream().subscribe((m) => {
            // if this is the value we set then incr (shouldnt happen...)
            if (m === 4) { 
                // mark the message happened synchronously
                messaged++;
            }
        });
        // carry out another set
        streamable.set(4);
        // expect messaged to stay the same - streamAdapter is closed
        chai.expect(messaged).to.equal(1);

        // complete test with done
        done();
    });

    it("should allow the Stream to be completed via the StreamAdapter", function (done) {
        // count the number of messages
        let messaged = 0;
        // create an instance so we can unsubscribe it
        const streamAdapter = new StreamAdapter();
        // construct a streamable writable
        const streamable = new Writable({
            "scope": {
                a: 1
            }
        }, "scope.a", {
            adapters: [
                streamAdapter
            ]
        });
        // pull a stream from the streamable
        streamable.stream().subscribe((message) => {
            // if this was tested with a BehaviourSubject then it would get 1 first
            if (message === 1) chai.expect(message).to.equal(1);
            // only record the second hit
            if (message === 2) {
                // exepct the message value set on the streams instance
                chai.expect(message).to.equal(2);
                // mark the message happened synchronously
                messaged++;
            }
        });
        // set the expected value
        streamable.set(2);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);

        // close all connections (and also close the streamAdapter)
        streamAdapter.complete();
        
        // carry out another set
        streamable.set(3);
        // expect messaged to be still equal 2
        chai.expect(messaged).to.equal(1);
        // pulling a stream again will recreate the associated Observable? But unsubscribe closed the StreamAdapter so no messages will arrive
        streamable.stream().subscribe(() => {
            // message is locked to "3" - will only emit on subscribe 
            messaged++;
        });
        // expect messaged to stay the same - streamAdapter is closed
        chai.expect(messaged).to.equal(2);
        // carry out another set
        streamable.set(4);
        // expect messaged to stay the same - streamAdapter is closed
        chai.expect(messaged).to.equal(2);

        // complete test with done
        done();
    });

    it("should allow the Stream to be unsubscribed from the Writable without closing the Observable", function (done) {
        // count the number of messages
        let messaged = 0;
        // create an instance so we can unsubscribe it
        const streamAdapter = new StreamAdapter();
        // construct a streamable writable
        const writable = new Writable({
            "scope": {
                a: 1
            }
        });
        // place streamable on instance
        const streamable = writable.get("", {
            adapters: [
                streamAdapter
            ]
        });
        // pull a stream from the streamable
        streamable.get("scope.a").stream().subscribe((message) => {
            // if this was tested with a BehaviourSubject then it would get 1 first
            if (message === 1) chai.expect(message).to.equal(1);
            // only record the second hit
            if (message === 2) {
                // exepct the message value set on the streams instance
                chai.expect(message).to.equal(2);
                // mark the message happened synchronously
                messaged++;
            }
        });

        // set the expected value
        streamable.get("scope.a").set(2);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);
        // close all connections (manually without closing the streamAdapter)
        const scopea = streamable.get("scope.a");

        // unsubscribe the adapter and all streams assoicated under the key (also close the Adapter?)
        scopea.unsubscribe(streamAdapter);

        // expect the stream method to have been dropped
        chai.expect(scopea.stream).to.equal(undefined);

        // carry out another set
        scopea.set(3);
        // expect messaged to be still equal 1
        chai.expect(messaged).to.equal(1);
        // expect the stream method to be removed
        chai.expect(scopea.stream).to.equal(undefined);
        // reassociate the streamAdapter and set value in one pass
        const scopea2 = scopea.get("", {
            adapters: [
                new StreamAdapter()
            ]
        });
        // construct new subscription
        scopea2.stream({raw: true}).subscribe((m) => {
            // on raw streams we can avoid behaviourSubjects first emit by checking for previous values
            if (m) {
                // mark the message happened synchronously
                messaged++;
            }
        });
        // same as before
        chai.expect(messaged).to.equal(1);
        // set value to the stream instance
        scopea2.set(5);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(2);

        // complete test with done
        done();
    });

    it("should allow the Stream to be completed from the Writable without closing the Observable", function (done) {
        // count the number of messages
        let messaged = 0, streamAdapter2 = undefined;
        // create an instance so we can unsubscribe it
        const streamAdapter = new StreamAdapter();
        // construct a streamable writable
        const writable = new Writable({
            "scope": {
                a: 1
            }
        });
        // place streamable on instance
        const streamable = writable.get("", {
            adapters: [
                streamAdapter
            ]
        });
        // pull a stream from the streamable
        streamable.get("scope.a").stream().subscribe((message) => {
            // if this was tested with a BehaviourSubject then it would get 1 first
            if (message === 1) chai.expect(message).to.equal(1);
            // only record the second hit
            if (message === 2) {
                // exepct the message value set on the streams instance
                chai.expect(message).to.equal(2);
                // mark the message happened synchronously
                messaged++;
            }
        });

        // set the expected value
        streamable.get("scope.a").set(2);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);
        // close all connections (manually without closing the streamAdapter)
        const scopea = streamable.get("scope.a");

        // unsubscribe the adapter and all streams assoicated under the key (also close the Adapter?)
        scopea.complete(streamAdapter); // * note that calling out to complete will complete an unsubscribe Observers but wont unsubscribe the Adapter

        // carry out another set
        scopea.set(3);
        // expect messaged to be still equal 1
        chai.expect(messaged).to.equal(1);
        // expect the stream method to be removed
        chai.expect(scopea.stream).to.equal(undefined);
        // reassociate the streamAdapter and set value in one pass
        const scopea2 = scopea.get("", {
            adapters: [
                (streamAdapter2 = new StreamAdapter())
            ]
        });
        // bacause streamAdapter is not unsubscribed the lastMessage the stream saw was set: scope.a -> 3
        scopea2.stream({raw: true}).subscribe((m) => {
            if (m) {
                // message value is locked by streamAdapter
                messaged++;
            }
        });
        // same as before
        chai.expect(messaged).to.equal(2);
        // set value to the stream instance
        scopea2.set(5);
        // expect messaged to be incrd
        chai.expect(messaged).to.equal(3);

        // completing then unsubscribing should not delete the stream method from the target
        const dropped = scopea2.get("~scope.b");
        // ensure its not undf
        chai.expect(dropped.stream).to.not.equal(undefined);
        // if the adapter is complete before we unsub then stream is not deleted
        streamAdapter2.complete();
        streamAdapter2.unsubscribe(dropped);
        // expect the stream method to not have been dropped
        chai.expect(dropped.stream).to.not.equal(undefined);


        // complete test with done
        done();
    });
    
    it("should allow the Streams to be constructed against a nest of StreamAdapters", function (done) {
        // count the number of messages
        let messaged = 0;
        // create an instance so we can unsubscribe it
        const streamAdapter1 = new StreamAdapter();
        const streamAdapter2 = new StreamAdapter();
        // construct a streamable writable
        const streamable = new Writable({
            "scope": {
                a: 1
            }
        }, "", {
            adapters: [
                streamAdapter1
            ]
        });
        // create a new position with boths streams
        const scopea = streamable.get("scope.a", {adapters: [streamAdapter2]});

        // no subscriptions until subscribe
        chai.expect( streamAdapter1.length == 0).to.equal(true);

        // produce a value stream over scope.a
        const streama = scopea.stream();

        // pull a stream from the streamable
        streama.subscribe((message) => {
            // if this was tested with a BehaviourSubject then it would get 1 first
            if (message === 1) chai.expect(message).to.equal(1);
            // only record the second hit
            if (message === 2) {
                // exepct the message value set on the streams instance
                chai.expect(message).to.equal(2);
                // mark the message happened synchronously
                messaged++;
            }
        });

        // Observer added to parent when we subscribe to child...
        chai.expect(streamAdapter1.length == 1).to.equal(true);

        // expect messaged to be at init val
        chai.expect(messaged).to.equal(0);

        // set the expected value to the parents stream
        streamable.get("scope.a").set(2);

        // expect messaged to be incrd
        chai.expect(messaged).to.equal(1);

        // drop just this subscription - will drop the chain back to roots StreamAdapter
        streamAdapter2._subject.unsubscribe();
        // drop again - this is equivalent of the prev command but has checks in place for if the subject is still present
        streamAdapter2._unsubscribe();
        // this is pushing branch coverage - completing after unsubscribing should do nothing
        streamAdapter2._complete();
        
        // check the exposed length of the registered Observers
        chai.expect(streamAdapter2.length == 0).to.equal(true);

        // check the exposed length of the registered Observers
        chai.expect(streamAdapter1.length == 0).to.equal(true);

        // carry out another set
        scopea.set(3);
        // expect messaged to be still equal 1
        chai.expect(messaged).to.equal(1);

        // pulling a stream again will recreate the associated Observable? But unsubscribe closed the StreamAdapter so no messages will arrive
        streama.subscribe((m) => {
            // if this is the value we set then incr (shouldnt happen...)
            if (m === 4) { 
                // mark the message happened synchronously
                messaged++;
            }
        });

        // carry out another set
        streamable.get("scope.a").set(4);
        // expect message to emit
        chai.expect(messaged).to.equal(2);

        // expect single observer
        chai.expect(streamAdapter1.length == 1).to.equal(true);

        // complete test with done
        done();
    });

    it("should allow the Streams to be constructed directly against StreamAdapter via .stream and .factory", function (done) {
        // count the number of messages
        let messaged = 0;
        // create an instance with a handed in bufferSize
        const streamAdapter = new StreamAdapter(undefined, () => new Subject(), 0);
        // construct a streamable writable
        const streamable = new Writable({
            "scope": {
                a: 1
            }
        }, "", {
            adapters: [
                streamAdapter
            ]
        });

        // value stream constructed without a target
        streamAdapter.stream(false, "scope.a", {raw: true}).subscribe((message) => {
            // only record the second hit
            if (message && message.value === 2) {
                // mark the message happened synchronously
                messaged++;
            }
        });

        // value stream constructed with target
        streamAdapter.stream(streamable, "scope.a", {raw: false}).subscribe((message) => {
            // only record the second hit
            if (message && message === 2) {
                // mark the message happened synchronously
                messaged++;
            }
        });

        // factory without a target
        const rawStreamFactory = streamAdapter.factory();

        // subscribe to the raw stream factory
        rawStreamFactory().subscribe((message) => {
            // only record the second hit
            if (message && message.value === 2 && message.key == "scope.a") {
                // mark the message happened synchronously
                messaged++;
            }
        });

        // subscribe to the raw stream factory
        rawStreamFactory("scope.a").subscribe((message) => {
            // only record the second hit
            if (message && message.value === 2) {
                // mark the message happened synchronously
                messaged++;
            }
        });

        // factory with a target
        const valueStreamFactory = streamAdapter.factory(streamable.get("scope.a"));

        // subscribe to the raw stream factory
        valueStreamFactory().subscribe((message) => {
            // only record the second hit
            if (message && message === 2) {
                // mark the message happened synchronously
                messaged++;
            }
        });

        // Observer added for the children of root and for root by rawStreamFactory
        chai.expect(streamAdapter.length == 2).to.equal(true);

        // make sure setting b doesnt hit the stream
        streamable.get("scope.b").set(2);
        
        // set the expected value to the parents stream
        streamable.get("scope.a").set(2);

        // expect messaged to be incrd
        chai.expect(messaged).to.equal(5);

        // complete test with done
        done();
    });

    it("should allow the streamAdapter to be ignorable if .skipStreamAdapter is passed through options", function (done) {
        // construct a streamable writable
        const writable = new Writable({
            "scope": {
                a: 1
            }
        });
        // start a streamable at known position
        const streamable = writable.get("scope.a", {
            adapters: [
                new StreamAdapter()
            ]
        });

        // expect the stream fn to be set
        chai.expect(typeof streamable.stream).to.equal("function");

        // expect the stream fn to be skipped
        chai.expect(typeof streamable.get("", {
            skipStreamAdapter: true
        }).stream).to.equal("undefined");
        
        // complete test with done
        done();
    });

});
