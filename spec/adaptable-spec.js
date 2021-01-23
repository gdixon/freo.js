// import chai for testing
import chai from 'chai';

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import { Adaptable } from "../src/internal/adaptable.js";

// set-up spec testing feature-set
describe("Adaptable ~ from ~ freo", function () {

    it("should respond to .toString with [object Adaptable] type", function (done) {
        // create a new instance...
        const adaptable = new Adaptable();
        // get the scope value from the instance
        chai.expect(adaptable.toString()).to.equal("[object Adaptable]");

        // complete test with done
        done();
    });

    it("should register and subscribe Adapters on construct", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let adapted = 0;
        // adapter as a class...
        class simpleAdapter {

            register(target, adapter) {
                // expect the options to be fed through
                if (adapter !== this) chai.expect(adapter.options.test).to.equal(true);
                // incr the adpater marker
                adapted++;
            }

        }
        // create a new instance...
        new Adaptable(false, [
            // if an entry doesnt match expectactions it will be skipped (useful for condition inclusions)
            false,
            // if the setup fails it will record an error
            {
                bad: {
                    setup: true
                }
            },
            // adapter can be processed with options set from the caller
            {
                options: {
                    test: true
                },
                adapter: simpleAdapter
            },
            // or as an immediate pass through to the adapter
            simpleAdapter,
            // or as an immediate pass through to the adapter
            {
                register: (target, adapter) => {

                    return new Promise((ready) => {
                        // expect the options to be fed through
                        chai.expect(adapter.options).to.equal(undefined);
                        // incr the adpater marker
                        adapted++;
                        // mark as ready
                        ready();
                    });
                }
            }
        ], true, function () {
            // expect the adapter to have been processed
            chai.expect(adapted).to.equal(3);

            // complete test with done
            done();
        });
    });

    it("should delay register if ready is false", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let adapted = 0, enqueued = [];
        // create a parent that can be waited on
        const parent = {
            // pick up adapters from the parent in the child
            _adapters: [{
                // adapter can be processed with options set from the caller
                options: {
                    test: true
                },
                adapter: {
                    register: (target, adapter) => {
                        // expect the options to be fed through
                        chai.expect(adapter.options.test).to.equal(true);
                        // incr the adpater marker
                        adapted++;
                    }
                }
            }],
            onReady: (fn) => {
                enqueued.push(fn)
            },
            ready: () => {
                enqueued.map((fn) => {
                    fn();
                });
            }
        }, adapters = [
            // if an entry doesnt match expectactions it will be skipped (useful for condition inclusions)
            false,
            // if the setup fails it will record an error
            {
                bad: {
                    setup: true
                }
            },
            // or as an immediate pass through to the adapter
            {
                register: (target, adapter) => {
                    // expect the options to be fed through
                    chai.expect(adapter.options).to.equal(undefined);
                    // incr the adpater marker
                    adapted++;
                }
            },
            // or as an immediate pass through to the adapter
            {
                register: (target, adapter) => {

                    return new Promise((ready) => {
                        // expect the options to be fed through
                        chai.expect(adapter.options).to.equal(undefined);
                        // incr the adpater marker
                        adapted++;
                        // mark as ready
                        ready();
                    });
                }
            }
        ];
        // create a new instance...
        new Adaptable(parent, adapters, true, () => {
            // expect the adapter to have been processed
            chai.expect(adapted).to.equal(6);

            // complete test with done
            done();
        });
        // expect the adapter to have been processed
        chai.expect(adapted).to.equal(0);
        // create a new instance...
        new Adaptable(parent, adapters, true);
        // expect the adapter to have been processed
        chai.expect(adapted).to.equal(0);
        // register the enqueued adapters
        parent.ready();
        // when parent redies both will be called and registered
        chai.expect(adapted).to.equal(6);
    });

    it("should delay register and subscribe if ready is false", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let adapted = 0, adapters = [
            // if an entry doesnt match expectactions it will be skipped (useful for condition inclusions)
            false,
            // if the setup fails it will record an error
            {
                bad: {
                    setup: true
                }
            },
            // adapter can be processed with options set from the caller
            {
                options: {
                    test: true
                },
                adapter: {
                    register: (target, adapter) => {
                        // expect the options to be fed through
                        chai.expect(adapter.options.test).to.equal(true);
                        // incr the adpater marker
                        adapted++;
                    }
                }
            },
            // or as an immediate pass through to the adapter
            {
                register: (target, adapter) => {
                    // expect the options to be fed through
                    chai.expect(adapter.options).to.equal(undefined);
                    // incr the adpater marker
                    adapted++;
                }
            },
            // or as an immediate pass through to the adapter
            {
                register: (target, adapter) => {
                    // expect the options to be fed through
                    chai.expect(adapter.options).to.equal(undefined);
                    // incr the adpater marker
                    adapted++;
                }
            }
        ];
        // create a new instance...
        const adaptable1 = new Adaptable(false, adapters, false);
        // expect the adapter to not have been processed yet
        chai.expect(adapted).to.equal(0);
        // register the enqueued adapters
        adaptable1.register(() => {
            // expect the adapter to have been processed
            chai.expect(adapted).to.equal(3);
            // create a new instance...
            const adaptable2 = new Adaptable(false, adapters, false);
            // expect the adapter to not have been processed yet
            chai.expect(adapted).to.equal(3);
            // register without a callback
            adaptable2.register();
            // expect adapters to register again
            chai.expect(adapted).to.equal(6);

            // complete test with done
            done();
        });

    });

    it("should subscribe adapters after construct", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let adapted = 0, log = [], registered = false;
        // create a new instance...
        new Adaptable(false, false, true, () => {
            // callback to mark registered
            registered = true;
        });
        // registered set synchronoulsy
        chai.expect(registered).to.equal(true);
        // create a new instance...
        const adaptable2 = new Adaptable(false, false, true);
        // register an error logger...
        adaptable2.subscribe({
            register: () => { },
            // record errors
            error: (err) => {
                log.push(err);
            }
        });
        // if adapter is inserted as falsy it will be skipped (no errors)
        adaptable2.subscribe(false);
        // if the setup fails it will record an error
        adaptable2.subscribe({
            bad: {
                setup: true
            }
        });
        // construct an async adapter (returns a promise on register)
        const asyncAdapter = {
            register: (target, adapter) => {

                return new Promise((ready) => {
                    // expect the options to be fed through
                    chai.expect(adapter.options).to.equal(undefined);
                    // incr the adpater marker
                    adapted++;
                    // mark as ready
                    ready();
                });
            }
        };
        // register adapter
        const register = adaptable2.subscribe(asyncAdapter, 0);
        // wait until registered
        register.then(() => {
            // expect to have placed the adapter at the front of the adapters
            chai.expect(adaptable2._adapters[0]).to.equal(asyncAdapter);
            // call register when already registered should do nothing
            adaptable2.register();
            // log holds single error
            chai.expect(log.length).to.equal(1);
            // expect log to hold error
            chai.expect(log[0].toString()).to.equal("TypeError: adapter is incompatible");
            // expect the adapter to have been processed
            chai.expect(adapted).to.equal(1);

            // complete test with done
            done();
        });
    });

    it("should allow registration to replace instance by returning an Adaptable", function (done) {
        // count how many times the first adapter is registered
        let count = 0;
        // create a blank instance which we will use to replace the instance we're about to create (working as a singleton)
        const different = new Adaptable();
        // create a new instance and replace it with an Adapter that returns different
        const target = new Adaptable(false, [
            {
                register: (target) => {
                    // mark that this adapter was registered on the target
                    target._seen = true;
                    // incr counter to mark the number of targets that we're adapted (should be 2)
                    count++;
                }
            },
            {
                register: (target, adapter) => { 
                    // register the targets adapters to "different" (this will include all Adapters before this one)
                    different.register(false, target._adapters.concat().splice(0, target._adapters.indexOf(adapter)), true);

                    // return the different instance
                    return different;
                }
            }
        ], true, function () {
            // expect callback to be called with different as ctx
            chai.expect(this).to.equal(different);
            // different has been passed through the first adapter
            chai.expect(this._seen).to.equal(true);

            // return this state
            return this;
        });
        // expect to receive different as target?
        chai.expect(different).to.equal(target);
        // different has been passed through the first adapter
        chai.expect(different._seen).to.equal(true);
        // expect to have registered the first adapter twice
        chai.expect(count).to.equal(2);
            
        // done synchronous
        done();
    });

    it("should allow registration to replace instance by returning an Adaptable asychronously", function (done) {
        // count how many times the first adapter is registered
        let count = 0;
        // create a blank instance which we will use to replace the instance we're about to create (working as a singleton)
        const different = new Adaptable();
        // mark diff so we can see it later
        different.diff = true;
        // create a new instance and replace it with an Adapter that returns different
        const target = new Adaptable(false, [
            {
                id:1,
                register: (target) => {
                    
                    return new Promise((resolve) => {
                        // mark that this adapter was registered on the target
                        target._seen = true;
                        // incr counter to mark the number of targets that we're adapted (should be 2)
                        count++;

                        // resolve the target
                        return resolve(target);
                    });
                }
            },
            {
                id:2,
                register: (target) => {
                    // this is a throw away instance
                    const temp = new Adaptable();
                    // wanting to check coverage for an instance thats not async after an async one
                    temp._adapters = target._adapters.concat();

                    // return the instance to replace target
                    return temp;
                }
            },
            {
                id:3,
                register: (target, adapter) => {

                    // register the original adapters and return a promise resolving to the "different" ctx
                    return new Promise((resolve) => {
                        // register the targets adapters to "different" (this will include all Adapters before this one - all registrations will be played through again)
                        const async = different.register(() => different, target._adapters.concat().splice(0, target._adapters.indexOf(adapter)), true);
                        
                        // return the different instance
                        return async.then(() => {
                            // *note that this adapter wont be instrumented over the new target, which is normally
                            // what you'd want - optionally record the adapter so that messages can be propagated accordingly
                            different._adapters.push(adapter);

                            // resolve with the different ctx
                            return resolve(different);
                        });
                    });
                }
            }
        ], true, function () {
            // expect callback to be called with different as ctx
            chai.expect(this).to.equal(different);
            // different has been passed through the first adapter
            chai.expect(this._seen).to.equal(true);
            // expect to have registered the first adapter twice
            chai.expect(count).to.equal(2);

            // done synchronous
            done();
        });
        // * note that different and target are not equal becuase the ctx swap happened asynchronously
        // after registration the internal _ctx will be subverted - any calls through adaptable/preparable/readable/writable will route through the ctx
        // when this isnt underscored the tests fail, but I cant work out whats using the promise structure, is 
        target._registration.then(() => {
            chai.expect(target._ctx).to.equal(different);
        });
        // the best way to utilise this would be to create a Readable which resolves to a different construct,
        // then you could readable.get() to move to that different construct (defined and associated via an Adapter)
    });

    it("should report on adapters which throw during registration", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let log = [];
        // create a new instance...
        new Adaptable(false, [
            {
                register: () => { },
                // record errors
                error: (err) => {
                    log.push(err);
                }
            }, {
                register: () => {

                    return new Promise((...[, reject]) => {
                        reject("Something went wrong")
                    });
                }
            }
        ], true, () => {
            // log holds single error
            chai.expect(log.length).to.equal(1);
            // expect log to hold error
            chai.expect(log[0].toString()).to.equal("Something went wrong");

            // complete test with done
            done();
        });
    });

    it("should noop any errors thrown during registration if no error handle is supplied", function (done) {
        // create a new instance...
        new Adaptable(false, [{
            register: () => {

                return new Promise((...[, reject]) => {
                    reject("Something went wrong")
                });
            }
        }
        ], true, () => {
            // complete test with done
            done();
        });
    });

    it("should subscribe adapters that carry out work on the message stream", function (done) {
        // record number of messages emitted
        let emits = 0, errors = 0;
        // create a new instance...
        const adaptable = new Adaptable(false, false, true);
        // tunnel empty message through
        const test = {};
        // construct an async adapter (returns a promise on register)
        const messageAdapter1 = {
            register: () => { },
            next: (message) => {
                // record emit
                emits++;
                // should always receive test (under this test case)
                chai.expect(message).to.equal(test);
            },
            error: (error) => {
                // record emit
                errors++;
                // should always receive test (under this test case)
                chai.expect(error).to.equal(test);
            }
        };
        // receive message 
        adaptable.subscribe(messageAdapter1);
        // tunnel message to adapters
        adaptable.next(test);
        // expect 1 emit
        chai.expect(emits).to.equal(1);
        // construct an async adapter (returns a promise on register)
        const messageAdapter2 = {
            adapter: {
                register: () => { },
                next: () => {
                    // record emit
                    emits++;

                    // return the same but different
                    return test
                },
                error: () => {
                    // record emit
                    errors++;

                    // overide and return test
                    return test;
                }
            }
        };
        // push to the front and change message before hitting the first adapter again
        adaptable.subscribe(messageAdapter2, 0);
        // send a new message but intercept and return test
        adaptable.next({ sender: test });
        // expect 3 emits
        chai.expect(emits).to.equal(3);
        // push an error through
        adaptable.error(new Error());
        // expect 2 errors
        chai.expect(errors).to.equal(2);

        // complete test with done
        done();
    });

    it("should not send messages to Adapters if the Adaptable is complete", function (done) {
        // record number of messages emitted
        let emits = 0;
        // create a new instance...
        const adaptable = new Adaptable(false, false, true);
        // tunnel empty message through
        const test = {};
        // construct an async adapter (returns a promise on register)
        const messageAdapter1 = {
            register: () => { },
            next: () => {
                // record emit
                emits++;
            },
            error: () => {
                // record emit
                emits++;
            }
        };
        // receive message 
        adaptable.subscribe(messageAdapter1);
        // complete the stream
        adaptable.complete();
        // calling complete again does nothing
        adaptable.complete();
        // tunnel message to adapters
        adaptable.next(test);
        // send an error
        adaptable.error(new Error());
        // expect 0 emits
        chai.expect(emits).to.equal(0);

        // complete test with done
        done();
    });

    it("should not send messages to Adapters if the Adaptable is unsubscribed (closed)", function (done) {
        // record number of messages emitted
        let emits = 0;
        // create a new instance...
        const adaptable = new Adaptable(false, false, true);
        // tunnel empty message through
        const test = {};
        // construct an async adapter (returns a promise on register)
        const messageAdapter1 = {
            register: () => { },
            next: () => {
                // record emit
                emits++;
            },
            error: () => {
                // record emit
                emits++;
            }
        };
        // receive message 
        adaptable.subscribe(messageAdapter1);
        // complete the stream
        adaptable.unsubscribe();
        // calling complete again does nothing
        adaptable.unsubscribe();
        // tunnel message to adapters
        adaptable.next(test);
        // send an error
        adaptable.error(new Error());
        // expect 0 emits
        chai.expect(emits).to.equal(0);

        // complete test with done
        done();
    });


    it("should allow for one Adapter to be completed from the stack without completing the Adaptable", function (done) {
        // record number of messages emitted
        let emits = 0, completes = 0;
        // create a new instance...
        const adaptable = new Adaptable(false, false, true);
        // construct an async adapter (returns a promise on register)
        const messageAdapter1 = {
            register: () => { },
            next: () => {
                // record emit
                emits++;
            },
            error: () => {
                // record emit
                emits++;
            },
            complete: () => {
                completes++;
            }
        };
        // place the messageAdapter as a contained Adapter
        const messageAdapter2 = {
            adapter: {
                register: () => { },
                next: () => {
                    // record emit
                    emits++;
                },
                error: () => {
                    // record emit
                    emits++;
                },
                complete: () => {
                    completes++;
                }
            }
        }
        // receive message 
        adaptable.subscribe(messageAdapter1);
        // complete the messageAdapter1
        adaptable.complete(messageAdapter1);
        // tunnel message to adapters
        adaptable.next({});
        // send an error
        adaptable.error(new Error());
        // expect 2 emits - completed still receives messages - its the Adapters responsibility to unsubscribe itself 
        chai.expect(emits).to.equal(2);
        // check complete was called
        chai.expect(completes).to.equal(1);
        // receive message 
        adaptable.subscribe(messageAdapter2);
        // complete the messageAdapter1
        adaptable.complete(messageAdapter2);
        // tunnel message to adapters
        adaptable.next({});
        // send an error
        adaptable.error(new Error());
        // expect 6 emits - completed still receives messages - its the Adapters responsibility to unsubscribe itself 
        chai.expect(emits).to.equal(6);
        // check complete was called
        chai.expect(completes).to.equal(2);

        // complete test with done
        done();
    });

    it("should allow for one Adapter to be unsubscribed from the stack without closing the Adaptable", function (done) {
        // record number of messages emitted
        let emits = 0, unsubscribes = 0;
        // create a new instance...
        const adaptable = new Adaptable(false, false, true);
        // construct an async adapter (returns a promise on register)
        const messageAdapter1 = {
            register: () => { },
            next: () => {
                // record emit
                emits++;
            },
            error: () => {
                // record emit
                emits++;
            },
            unsubscribe: () => {
                unsubscribes++;
            }
        };
        // place the messageAdapter as a contained Adapter
        const messageAdapter2 = {
            adapter: {
                register: () => { },
                next: () => {
                    // record emit
                    emits++;
                },
                error: () => {
                    // record emit
                    emits++;
                },
                unsubscribe: () => {
                    unsubscribes++;
                }
            }
        }
        // receive message 
        adaptable.subscribe(messageAdapter1);
        // complete the messageAdapter1
        adaptable.unsubscribe(messageAdapter1);
        // tunnel message to adapters
        adaptable.next({});
        // send an error
        adaptable.error(new Error());
        // expect 2 emits - unsubscribe still receives messages - its the Adapters responsibility to unsubscribe itself 
        chai.expect(emits).to.equal(2);
        // check complete was called
        chai.expect(unsubscribes).to.equal(1);
        // receive message 
        adaptable.subscribe(messageAdapter2);
        // complete the messageAdapter1
        adaptable.unsubscribe(messageAdapter2);
        // tunnel message to adapters
        adaptable.next({});
        // send an error
        adaptable.error(new Error());
        // expect 6 emits - unsubscribed still receives messages - its the Adapters responsibility to unsubscribe itself 
        chai.expect(emits).to.equal(6);
        // check complete was called
        chai.expect(unsubscribes).to.equal(2);

        // complete test with done
        done();
    });

    it("should not send messages to Adapters if the Adapter is complete", function (done) {
        // record number of messages emitted
        let emits = 0;
        // create a new instance...
        const adaptable = new Adaptable(false, false, true);
        // tunnel empty message through
        const test = {};
        // construct an async adapter (returns a promise on register)
        const messageAdapter1 = {
            closed: true,
            register: () => { },
            next: () => {
                // record emit
                emits++;
            }
        };
        // receive message 
        adaptable.subscribe(messageAdapter1);
        // tunnel message to adapters
        adaptable.next(test);
        // expect 1 emit
        chai.expect(emits).to.equal(0);

        // complete test with done
        done();
    });

});
