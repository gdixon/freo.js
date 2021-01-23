// import chai for testing
import chai from 'chai';

// test subject (the stream utility enables the root Observable to be filtered and shared)
import { stream } from "../../src/internal/utility/stream.js";

// test the stream utility against writable instances (this is also a method on the Writable instance itself)
import { Writable } from "../../src/internal/writable.js";

// create a behaviourSubject to hold the stream
import { BehaviourSubject } from "@gdixon/fre";

// set-up spec testing feature-set
describe("stream ~ from ~ freo/utility", function () {

    it("should stream values corresponding to a writable instance", function (done) {
        // create a new instance...
        const writable = new Writable({}, "", {creationMaxDepth: -1});
        // create a new observable to hold the stream
        const observable = new BehaviourSubject();
        // count how many times the subscribed observer was hit
        let count = 0, mess = undefined;
        // register the Observables next method as an adapter
        writable.subscribe({
            register: () => { },
            next: (m) => {
                observable.next(m);
            }
        });
        // subscribe to the instance using the value stream -- if the value is filtered away then it wont hit the subscription
        stream(observable, writable.get("scope.a"), "scope.a").subscribe((message) => {
            if (message) {
                // incr the outside counter
                count++;
                // // message to outer ctx so we can check its value with chai
                mess = message;
            }
        });
        // perform set (this should fill lastMessage)
        writable.get("scope.a").set(1);
        // expect the count to have been incremented
        chai.expect(count).to.equal(1);
        // expect the count to have been incremented
        chai.expect(mess).to.equal(1);
        // complete test with done
        done();
    });

    it("should create one filtered stream for each key filtered from the writable root instance", function (done) {
        // create a new instance...
        const writable = new Writable({}, "", { immutable: true, creationMaxDepth: -1 });
        // create a new observable to hold the stream
        const observable = new BehaviourSubject();
        // register the Observables next method as an adapter
        writable.subscribe({
            register: () => { },
            next: (m) => {
                observable.next(m);
            },
            error: (e) => {
                observable.error(e);
            }
        });
        // count how many times the subscribed observer was hit
        let count = 0, mess = undefined;
        // create stream against scope.a
        const stream1 = stream(observable, writable.get("scope.a"), "");
        // nextMethod placed against stream1 (isolate to just scope.a)
        const nextMethod = (message) => {
            if (message) {
                // expect the references to be equal
                // immutable streams will always skipCloning when returing a value stream - we could use this to check equality against local references
                chai.expect(message).to.equal(writable.get("scope.a").raw(true));
                // incr the outside counter
                count++;
                // message to outer ctx so we can check its value with chai
                mess = message;
            }
        };
        // cancel if we encounter an error through the stream
        const errorMethod = (err) => {
            done(err);
        }
        // subscribe to the instance using the value stream -- if the value is filtered away then it wont hit the subscription
        const sub = stream1.subscribe(nextMethod, errorMethod);
        // expect everything to hold just one observer
        chai.expect(observable.observers.length).to.equal(1);
        chai.expect(observable.observed.filters.scope._ref.count).to.equal(1);
        chai.expect(observable.observed.filters.scope.filters.a._ref.count).to.equal(1);
        // check the filter saved at root is not replace when we stream again
        let filter = observable.observed.filters.scope.filters.a;
        // record the current subject (expect it to be recreated)
        const subject1 = filter._subject;
        // drop the subscription
        sub.unsubscribe();
        // expect the filter to be dropped when the subscription is dropped
        chai.expect(observable.observed.filters.scope).to.equal(undefined);
        // chai.expect(observable.observed.filters.scope.refCount).to.equal(0);
        chai.expect(observable.observers.length).to.equal(0);
        // subscribe to the instance using the value stream -- if the value is filtered away then it wont hit the subscription
        const sub2 = stream1.subscribe(nextMethod, errorMethod);
        // expect filter to be associated
        chai.expect(filter._subject).to.not.equal(subject1);
        // drop the subscription again
        sub2.unsubscribe();
        // subscribe to the instance using the value stream -- if the value is filtered away then it wont hit the subscription
        const sub3 = stream(observable, writable.get("scope.a"), "").subscribe(nextMethod, errorMethod);
        // this will be a different instance
        let filter2 = observable.observed.filters.scope.filters.a;
        // subscribe to the same stream should revive the filter
        const sub4 = stream1.subscribe(nextMethod, errorMethod);
        // filters will not match
        chai.expect(filter).to.not.equal(filter2);
        // expect the filters to be equal
        chai.expect(observable.observed.filters.scope.filters.a).to.equal(filter2);
        // expect the refCount to be aware of 2 instances
        chai.expect(observable.observed.filters.scope.filters.a._ref.count).to.equal(2);
        // expect to only have one subscription at root pointing to the scope filter
        chai.expect(observable.observers.length).to.equal(1);
        // subscribe to the instance using the value stream -- if the value is filtered away then it wont hit the subscription
        const sub5 = stream(observable, writable.get("scope.a"), "").subscribe(nextMethod, errorMethod);
        // expect the refCount to be aware of 3 instances
        chai.expect(observable.observed.filters.scope.filters.a._ref.count).to.equal(3);
        // set the value as an object
        let b = {b: 1}
        // perform set (this should fill lastMessage)
        writable.get("scope.a").set(b);
        // expect the count to have been incremented
        chai.expect(count).to.equal(3);
        // expect the msg to match - but not be equal
        chai.expect(mess).to.eql(b);
        // message value is cloned as its set into the obj to maintain immutable state
        chai.expect(mess).to.not.equal(b);        
        // start unsubscribing the sources (any order - refCount will handle the drop)
        sub4.unsubscribe();
        // expect the filter to still be present whilst it holds value
        chai.expect(observable.observed.filters.scope.filters.a).to.not.equal(undefined);
        // issue unsubscribe on last source
        sub5.unsubscribe();
        // expect the filter to still be present whilst it holds value
        chai.expect(observable.observed.filters.scope.filters.a).to.not.equal(undefined);
        // issue unsubscribe on last source
        sub3.unsubscribe();
        // once all on filter have unsubscribed the filter is dropped
        chai.expect(observable.observers.length).to.equal(0);
        // ensure the filter position was dropped
        chai.expect(observable.observed.filters.scope).to.equal(undefined);
        // complete test with done
        done();
    });

    it("should return undefined if we attempt to stream against a non-writable target", function (done) {
        // create a new observable to hold the stream
        const observable = new BehaviourSubject();
        // can only stream writable targets
        chai.expect(stream(observable, {}, "")).to.equal(undefined);
        // complete test with done
        done();
    });

    it("should throw an error if a valueStream is requested without a target",  function (done) {
        let error = false;
        // create a new observable to hold the stream
        const observable = new BehaviourSubject();
        // cannot create a value stream without providing the Freo target
        try {
            stream(observable, undefined, "scope.a")
        } catch (err) {
            error = err.toString();
        }
        // expect the above attempt to throw an error
        chai.expect(error).to.equal("TypeError: cannot produce a value stream without a target");
        // complete test with done
        done();
    })


});