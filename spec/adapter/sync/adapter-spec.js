// import chai for testing
import chai from 'chai';

// Test registration against a non-stremabale (should fail to register)
import { Writable } from "../../../src/internal/writable.js";

// SyncAdapter must only be used against a Writable instance
import { Readable } from "../../../src/internal/readable.js";

// test subject (SyncAdapter to link Writable to Worker)
import { SyncAdapter } from "../../../src/internal/adapter/sync/adapter.js";

// clear everything constructed as mock
const cleanState = () => {
    // delete the current set of mocks so that we're definately starting a fresh each spec
    delete global.window;
    delete global.location;
    delete global.navigator;
    delete global.MessageChannel;
};

// navigator promise response - returns a ServiceWorker with an active state 
// - postMessage dummys the MessageChannel response so that any messages sent are immeditaly responded to
const readyResolution = {
    active: {
        postMessage: (message, port) => {
            // reply to the sendMessage with the message sent
            port[0].onmessage(message);
        }
    }
};

// mock the window properties (addEventListener)
const prepareWindow = (listeners) => {
    // window.addEventListener
    Object.assign(global, {
        window: {
            // Registration uses load and beforeunload to settle connection to ServiceWorker
            addEventListener: function (name, fn) {
                // register beforeunload for later
                if (name == "beforeunload") {
                    // calling will invoke sendMessage->dropLead if _isLead is true
                    listeners[name] = fn;
                } else {
                    // call to "load" immeditaly
                    fn.call(this);
                }
            }
        }
    });
}

// mock the location properties
const prepareLocation = () => {
    // location.reload, location.reloaded
    Object.assign(global, {
        location: {
            // Reload the page if ServiceWorker is present but not active
            reload: () => {
                // when reload is called - mark as reloaded
                Object.assign(global, {
                    location: {
                        reloaded: true
                    }
                })
            }
        }
    });
}

// mock the navigator - records listeners and passes through some properties as responses
const prepareNavigator = (listeners, readyResolution, promiseResolution, controllerActive, registrationActive, unregisterThrows) => {
    // navigator.serviceWorker
    Object.assign(global, {
        navigator: {
            serviceWorker: {
                // place a promise onto ready for immediate resolution (according to readyResolution)
                ready: new Promise((resolve) => resolve(readyResolution)),
                // register the requested serviceWorker
                register: (url, options) => {
                    // mark them at serviceWorker position
                    listeners['serviceWorker'] = listeners['serviceWorker'] || {};
                    // record url
                    listeners['serviceWorker']['url'] = url;
                    // only scope is set from options
                    listeners['serviceWorker']['scope'] = options.scope;

                    // returns a promise which is accepted or rejected based on promiseResolution
                    return new Promise((resolve, reject) => {

                        // ready, postMessage
                        return promiseResolution(resolve, reject);
                    });
                },
                // record listerners
                addEventListener: (name, fn) => {
                    // mark them at serviceWorker position
                    listeners['serviceWorker'] = listeners['serviceWorker'] || {};
                    // recorded as named fns
                    listeners['serviceWorker'][name] = fn;
                    // register a controller change
                    if (name === "controllerchange") {
                        // if we're registering controllerchange call it immediately with an active controller
                        fn((controllerActive ? { target: { controller: { } } } : false));
                    }
                },
                getRegistrations: () => new Promise((resolve) => resolve([(registrationActive ? {
                    unregister: () => {
                        // mark them at serviceWorker position
                        listeners['serviceWorker'] = listeners['serviceWorker'] || {};
                        // record that the sw was unregistered
                        listeners['serviceWorker']['unregistered'] = true;
                        // throw error from unregister
                        if (unregisterThrows) throw(new Error("unregister error"));
                    }
                } : false)].filter((v) => v)))
            }
        }
    });
}

// prepare the messageChannel to dummy the expected messages and their responses
const prepareMessageChannel = (listeners, initialData, isLead, dropLead) => {
    // messageChannel
    Object.assign(global, {
        // construct the channel as class
        MessageChannel: class MessageChannel {
            constructor() {
                // when constructed we can fill the parts
                this.port1 = {
                    onmessage: () => {}
                }
                this.port2 = {
                    onmessage: (event) => {
                        // intercept and reply to the following messages....
                        if (event.command === "all") {
                            event.data = initialData;
                        } else if (event.command == "isLead") {
                            event.data = isLead;
                        } else if (event.command == "dropLead") {
                            event.data = dropLead;
                        } else if (event.command == "withError") {
                            event.error = "error";
                        }
                        // record how many messages have been posted into listeners
                        listeners.postedMessages = (listeners.postedMessages ? listeners.postedMessages+1 : 1);
                        // response to message with event data
                        this.port1.onmessage({ data: event });
                    }
                }
            }
        }
    });
};

// set-up spec testing feature-set
describe("SyncAdapter ~ from ~ freo/extension", function () {

    it("should create a ServiceWorkerRegister as a singleton and correct the root for future connections", function (done) {
        // adapter that alters registrations will be registered twice
        let registrations = 0;
        // adapter from registration
        const adapter1 = new SyncAdapter();
        // mark the target and incr registration count
        const adapter2 = {
            // carry through some registration side-effects
            register: (target) => {
                // mark as adapted
                target.adapted = true;
                // incr registrations count
                registrations++;
            }
        };
        // create Writable instance as opening connection
        const instance1 = new Writable({}, "", {
            immutable: true,
            adapters: [
                adapter1,
                adapter2
            ]
        });
        // second instance will follow the first instance placing its root as to _target
        const instance2 = new Writable({}, "", {
            immutable: true,
            adapters: [
                adapter1,
                adapter2
            ]
        });
        // when the second instance is ready it will be sharing its root with the first instance
        instance2.onReady(() => {
            // should return the same instance
            chai.expect(instance1.root()).to.equal(instance2.root());
            // adapter2 is registered every time it is present
            chai.expect(registrations).to.equal(2);
            // expect adapters from the source target to be added infront of any adapters added to subsequent adapters
            chai.expect(instance2._adapters.indexOf(adapter1)).to.equal(0);
            chai.expect(instance2._adapters.indexOf(adapter2)).to.equal(1);
            // make a get request (producing a new Writable synchronously (expect it have adapter2 applied))
            chai.expect(instance2.get("a").adapted).to.equal(true);
            // expect adapter2.register to run every time we do a get
            chai.expect(registrations).to.equal(3);
            // third instance will follow the first instance placing its root as to _target
            const instance3 = new Writable({}, "", {
                immutable: true,
                adapters: [
                    adapter1,
                    adapter2
                ]
            });
            // when the third instance is ready it will be sharing its root with the first instance
            instance3.onReady(() => {
                // expect adapter2.register to run every time we do a get
                chai.expect(registrations).to.equal(4);
                // complete test with done
                done();
            });
        });
    });

    it("should create a ServiceWorkerRegister as a singleton and allow connection to be reset", function (done) {
        // adapter from registration
        const adapter = new SyncAdapter();
        // factory instance is preparable
        const instance1 = new Writable({}, "", {
            immutable: true,
            adapters: [
                adapter
            ]
        });
        const instance2 = new Writable({}, "", {
            immutable: true,
            adapters: [
                {
                    adapter: adapter,
                    options: {
                        reset: true
                    }
                }
            ]
        });
        // when the second instance is ready it will have taken control of the Adapter
        instance2.onReady(() => {
            // should return the same instance
            chai.expect(instance1.root()).to.not.equal(instance2.root());
            // adapter holds instance2 root as source
            chai.expect(adapter._source).to.equal(instance2.root());

            // complete test with done
            done();
        });
    });

    it("should not register ServiceWorker adapter if registered against a non-Writable and push error through to instances error handler", function (done) {
        // record thrown errors
        const log = [];
        // adapter from registration
        const adapter = new SyncAdapter();
        // contain adapters and place error handler
        const adapters = [
            // all adapters must have register method but errors wont use it
            {
                adapter: {
                    error: (err) => {
                        log.push(err)
                    }
                }
            },
            adapter
        ];
        // factory instance is preparable
        const instance = new Readable({}, "", {
            adapters: adapters
        });
        // when ready check for presents of worker and for errors on the log
        instance.onReady(() => {
            // should return the same instance
            chai.expect(instance._worker).to.equal(undefined);
            // one message in the log
            chai.expect(log.length).to.equal(1);
            // expect typeError
            chai.expect(log[0].toString()).to.equal("TypeError: SyncAdapter can only be applied against a Writable instance");
            // complete test with done
            done();
        });
    });
        
    it("should allow for the correct order of proceedings (worker.ready -> writable.init -> writable.prepare -> writable.ready)", function (done) {
        // ensure the state is clean
        cleanState();
        // check that the worker is marked as ready
        let workerReady = false;
        // factory instance is preparable
        const instance = new Writable({}, "", {
            immutable: true,
            creationMaxDepth: -1,
            adapters: [
                {
                    adapter: new SyncAdapter(),
                    options: {
                        onReady: () => {
                            workerReady = true;
                        }
                    }
                }
            ],
            prepare: function (ready) {
                // worker is marked ready
                chai.expect(workerReady).to.equal(true);
                // set initial state
                this.set({
                    a: {
                        b: 1
                    }
                });
                // mark as ready
                ready();
            }
        });
        // when the second instance is ready it will be sharing its root with the first instance
        instance.onReady(function() {
            // should return the same instance
            chai.expect(this.get("a.b").raw()).to.equal(1);
            // assign lead position - this works even without usable SW
            this._worker.leaderElection({data: true});
            // complete test with done
            done();
        });
    });

    it("should report on failed attempts and let them slip through (window undefined)", function (done) {
        // ensure the state is clean
        cleanState();
        // assign workerReady on build
        let workerReady = false, log = [];
        // catching errors allows continued use as a global store
        const instance = new Writable({}, "", {
            immutable: true,
            adapters: [   
                // all adapters must have register method but errors wont use it
                {
                    adapter: {
                        error: (err) => {
                            log.push(err)
                        }
                    }
                },         
                {
                    adapter: new SyncAdapter(),
                    options: {
                        onReady: () => {
                            workerReady = true;
                        }
                    }
                }
            ],
        });
        // immediately ready
        instance.onReady(function () {
            // worker is marked ready
            chai.expect(workerReady).to.equal(true);
            // error on worker reads as...
            chai.expect(this._worker._error.toString()).to.equal("ReferenceError: window is not defined");
            // check that the log received the error
            chai.expect(log.length).to.equal(1);
            // check that it holds the same value as _error
            chai.expect(log[0].toString()).to.equal("ReferenceError: window is not defined");
            // done on error
            done();
        });
    });

    it("should report on failed attempts and let them slip through (navigator undefined)", function (done) {
        // clear mocks
        cleanState();
        // load the window defintions
        prepareWindow();
        // assign workerReady on build
        let workerReady = false;
        // catching errors allows continued use as a global store
        const instance = new Writable({}, "", {
            immutable: true,
            adapters: [            
                {
                    adapter: new SyncAdapter(),
                    options: {
                        onReady: () => {
                            workerReady = true;
                        }
                    }
                }
            ],
        });
        // immediately ready
        instance.onReady(function () {
            // worker is marked ready
            chai.expect(workerReady).to.equal(true);
            // error on worker reads as...
            chai.expect(this._worker._error.toString()).to.equal("ReferenceError: navigator is not defined");
            // done on error
            done();
        });
    });

    it("should catch failed attempts when the ready method receives an error", function (done) {
        // record the listeners
        const listeners = {};
        // clear mocks
        cleanState();
        // throwing on ready
        prepareNavigator(listeners, readyResolution, (resolve) => {

            // ready, postMessage
            return resolve(readyResolution)
        }, true);
        // window
        prepareWindow(listeners);
        // messageChannel
        prepareMessageChannel(listeners, "test", false, false);
        // extend the option with an additional prepare fn to delay ready procedure until the worker is ready
        new Writable({}, "", {
            immutable: true,
            adapters: [{
                adapter: new SyncAdapter(),
                options: {
                    onReady: () => {
                        throw ("error");
                    }
                }
            }],
            // bridge the Freo singleton to the ServiceWorkerRegister instance
            prepare: function (callback) {
                // expect error to be thrown via the ready call from onReady'ed methods
                chai.expect(this._worker._error).to.equal("error");
                // callback to finish the writable prep
                callback();
                // done
                done();
            }
        });
    });

    it("should catch failed attempts when the ready method receives an error and apply SkipSendMessage to cancel sync traffic", function(done) {
        // record the listeners
        const listeners = {};
        // clear mocks
        cleanState();
        // throwing on ready
        prepareNavigator(listeners, readyResolution, (resolve) => {

            // ready, postMessage
            return resolve(readyResolution)
        }, true);
        // window
        prepareWindow(listeners);
        // messageChannel
        prepareMessageChannel(listeners, "test", false, false);
        // extend the option with an additional prepare fn to delay ready procedure until the worker is ready
        new Writable({}, "", {
            immutable: true,
            adapters: [{
                adapter: new SyncAdapter(),
                options: {
                    onReady: () => {
                        throw ("error");
                    }
                }
            }],
            // bridge the Freo singleton to the ServiceWorkerRegister instance
            prepare: function (callback) {     
                // expect error to be thrown via the ready call
                chai.expect(this._worker._error).to.equal("error");
                // 2 messages we're posted during setup phase ("isLead" and "all")
                chai.expect(listeners.postedMessages).to.equal(2)
                // call to setup beforeunload
                this._worker.leaderElection({data: true});
                // call to beforeunload
                listeners.beforeunload();
                // check for number of postedMessages (isLead and all - after ready threw skipSendMessage was set to true and no other messages were posted)
                chai.expect(listeners.postedMessages).to.equal(2)
                // callback to finish the writable prep
                callback();
                // done
                done();
            }
        });
    });

    it("should reload if no active worker is returned", function (done) {
        // new resolution without active definition
        const readyResolution = {};
        // clear mocks
        cleanState();
        // location
        prepareLocation();
        // prepare the navigator without an active controller             
        prepareNavigator({}, readyResolution, (resolve) => {

            // ready, postMessage
            return resolve(readyResolution)
        }, false);
        // window
        prepareWindow({});
        // messageChannel
        prepareMessageChannel({}, "test", false, false);
        // extend the option with an additional prepare fn to delay ready procedure until the worker is ready
        new Writable({}, "", {
            immutable: true,
            adapters: [{
                adapter: new SyncAdapter(),
                options: {
                    onReady: function() {
                        // check that lead position is dropped
                        chai.expect(this._lead).to.equal(false);
                        // should have reloaded the page to attempt to get control
                        chai.expect(location.reloaded).to.equal(true);
                        // done on error
                        done();
                    }
                }
            }]
        });
    });

    it("should catch failed attempts where error is thrown by prep and then by unregister", function (done) {
        // clear mocks
        cleanState();
        // location
        prepareLocation();
        // window
        prepareWindow({});
        // throw inside the ready promise response
        prepareNavigator({}, readyResolution, (...[, reject]) => {

            // simulate an error inside the serviceWorker
            return reject(new Error("error"));
        }, true, true, true);
        // extend the option with an additional prepare fn to delay ready procedure until the worker is ready
        new Writable({}, "", {
            immutable: true,
            adapters: [{
                adapter: new SyncAdapter(),
                options: {
                    scope: "./",
                    filename: "./test.js",
                    onReady: async function() {
                        // expect error to be thrown
                        chai.expect(this._error.toString()).to.equal("Error: error");
                        // reset and await result
                        await this.reset();
                        // error should have propagated from the unregister method
                        chai.expect(this._error.toString()).to.equal("Error: unregister error");
                        // location was not reloaded - controller was present (readyResolution)
                        chai.expect(location.reloaded).to.equal(undefined);
                        // done on error
                        done();
                    }
                }
            }]
        });
    });

    it("should register a Writable-Writable instance using SyncAdapter as an Adapter syncing changes in both directions", function (done) {
        // record listeners outside of preparation for use onReady
        const listeners = {};
        // record state of lead
        let isLead = false;
        // clear mocks
        cleanState();
        // prepare the navigator with an active controller
        prepareNavigator(listeners, readyResolution, (resolve) => {

            // ready, postMessage
            return resolve(readyResolution)
        }, true, true);
        // window
        prepareWindow(listeners);
        // messageChannel
        prepareMessageChannel(listeners, "test", true, false);
        // extend the option with an additional prepare fn to delay ready procedure until the worker is ready
        const instance = new Writable({}, "", {
            immutable: true,
            creationMaxDepth: -1,
            adapters: [{
                adapter: new SyncAdapter(),
                options: {
                    scope: "./",
                    filename: "./test.js",
                    reset: true,
                    onReady: function() {
                        // expect 2 messages to have been posted to the worker (isLead and all)
                        chai.expect(listeners.postedMessages).to.equal(2);
                        // expect filename and scope to feed through from options
                        chai.expect(listeners.serviceWorker.url).to.equal("./test.js");
                        chai.expect(listeners.serviceWorker.scope).to.equal("./");
                        // call to beforeunload
                        listeners.beforeunload();
                        // expect 3 messages - beforeunload called out to dropLead
                        chai.expect(listeners.postedMessages).to.equal(3);
                        // send a command expect to get raw res
                        this.sendMessage({command: "withError"}).catch((res) => {
                            // no .then(res) just error
                            chai.expect(res).to.equal("error")
                        });
                        // expect 4 messages - withError was still sent
                        chai.expect(listeners.postedMessages).to.equal(4);
                    },
                    onTakeLead: function() {
                        isLead = true;
                    },
                    onDropLead: function() {
                        isLead = false;
                    }
                }
            }]
        });

        // when we're ready finish the test by dummying all the messages in and out
        instance.onReady(async function () {
            // set-up the initial state
            this.get("a.scope").set(1);
            // expect messages to have been posted to the worker
            chai.expect(listeners.postedMessages - 4).to.equal(1);
            // expect value to have been set
            chai.expect(this.get("a.scope").raw()).to.equal(1);

            // delete scope var
            this.get("a.scope").delete();
            // expect messages to have been posted to the worker
            chai.expect(listeners.postedMessages - 4).to.equal(2);
            // check that it was deleted
            chai.expect(this.get("a.scope").raw()).to.equal(null);

            // cancel the current lead position
            this._worker._lead = false;
            this._worker._test = true;
            // send takeLead request
            await listeners['serviceWorker']['message']({ data: "takeLead" });
            // expect lead to have been reinstated
            chai.expect(this._worker._lead).to.equal(true);
            // check that onTakeLead method was called
            chai.expect(isLead).to.equal(true);

            // drop lead
            this._worker.leaderElection({data:false});
            // check that onDropLead method was called
            chai.expect(isLead).to.equal(false);

            // receive service worker activated which will takeLead again
            await listeners['serviceWorker']['message']({ data: "activated" });
            // lead it true again
            chai.expect(this._worker._lead).to.equal(true);
            // lead it true again
            chai.expect(isLead).to.equal(true);

            // receive state change from worker
            await listeners['serviceWorker']['message']({ data: { m: "set", k: "a.scope", n: 2 } });
            // expect the state to have been updated
            chai.expect(this.get("a.scope").raw()).to.equal(2);

            // receive delete request from worker
            await listeners['serviceWorker']['message']({ data: { m: "delete", k: "a.scope", n: null } });
            // expect state to be updated
            chai.expect(this.get("a.scope").raw()).to.equal(null);

            // send a command that doesnt hit anything - nothing changes
            await listeners['serviceWorker']['message']({ data: { m: "ignored" } });

            // check the root to hold expected value
            chai.expect(JSON.stringify(this.raw(), (key, value) => {
                if (value !== null) return value
              })).to.equal(`{"a":{}}`);

            // call to beforeunload
            listeners.beforeunload();
            // lead it true again
            chai.expect(this._worker._lead).to.equal(false);
            // lead it true again
            chai.expect(isLead).to.equal(false);

            // clear lead position
            this._worker._isLead = "none"
            // call to beforeunload
            listeners.beforeunload();

            // drop the current worker
            await this._worker.reset();
            // expect old worker to be unregistered
            chai.expect(listeners.serviceWorker.unregistered).to.equal(true);
            
            // finished testing after all awaited have completed
            done()
        });
    });

});