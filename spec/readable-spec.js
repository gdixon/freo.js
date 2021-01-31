// import chai for testing
import chai from 'chai';

// test subject (Readable extends Preparable to add .get, .raw and value reflection methods)
import { Readable } from "../src/internal/readable.js";

// set-up spec testing feature-set
describe("Readable ~ from ~ freo", function () {

    it("should accept initialValue and key", function (done) {
        // create a new instance...
        const readable = new Readable({ a: 1 }, "a");
        // add a method to the queuedFns queue
        const value = readable.raw();
        // expect the fn to be queued but not called
        chai.expect(value).to.equal(1);
        // calling init a second time shouldnt change anything
        readable.init();
        // get the scope value from the instance
        chai.expect(readable.toString()).to.equal("[object Readable]");
        
        // complete test with done
        done();
    });

    it("should prepare with adapters", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let adapted = 0, obj = {}, log = [];
        // create a new instance...
        const readable = new Readable(obj, "", {
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [
                // record any errors thrown during set up (silent apart from this entry point)
                {
                    adapter: {
                        error: (err) => {
                            log.push(err);
                        },
                    }
                },
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
                            // expect the obj to be contained in target
                            chai.expect(target._target).to.equal(obj);
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
                        // expect the obj to be contained in target
                        chai.expect(target._target).to.equal(obj);
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
                            // expect the obj to be contained in target
                            chai.expect(target._target).to.equal(obj);
                            // expect the options to be fed through
                            chai.expect(adapter.options).to.equal(undefined);
                            // incr the adpater marker
                            adapted++;
                            // mark as ready
                            ready();
                        });
                    }
                }
            ]
        });
        // done when ready
        readable.onReady(function () {
            // calling ready again has no effect
            readable.ready();
            // calling prepare again has no effect
            readable.prepare();
            // expect the adapter to have been processed
            chai.expect(adapted).to.equal(3);
            // expect the adapters to be copied over on get
            chai.expect(this.get("a")._adapters).to.eql(this._adapters);
            // expect to be clean if we skipAdapters
            chai.expect(this.get("test", {skipAdapters: true})._adapters).to.eql([]);
            

            // complete test with done
            done();
        });
    });

    it("should allow adapters after construct", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let adapted = 0, obj = {}, log = [];
        // create a new instance...
        const readable = new Readable(obj, "", {
            // record any errors thrown during set up (silent apart from this entry point)
            adapters: [{
                adapter: {
                    error: (err) => {
                        log.push(err);
                    },
                }
            }],
        });
        // if adapter is inserted as falsy it will be skipped (no errors)
        readable.subscribe(false);
        // if the setup fails it will record an error
        readable.subscribe({
            bad: {
                setup: true
            }
        });
        // register adapter
        readable.subscribe({
            register: (target, adapter) => {

                return new Promise((ready) => {
                    // expect the obj to be contained in target
                    chai.expect(target._target).to.equal(obj);
                    // expect the options to be fed through
                    chai.expect(adapter.options).to.equal(undefined);
                    // incr the adpater marker
                    adapted++;
                    // mark as ready
                    ready();
                });
            }
        });
        // done when ready
        readable.onReady(function () {
            // calling ready again has no effect
            readable.ready();
            // calling register again has no effect
            readable.register();
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

    it("should report on adapters which throw during registration", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, log = [];
        // create a new instance...
        const readable = new Readable(obj, "", {
            adapters: [
                // record any errors thrown during set up (silent apart from this entry point)
                {
                    adapter: {
                        error: (err) => {
                            log.push(err);
                        },
                    }
                },
                {
                    register: () => {

                        return new Promise((...[, reject]) => {
                            reject("Something went wrong")
                        });
                    }
                }
            ]
        });
        // done when ready
        readable.onReady(function () {
            // log holds single error
            chai.expect(log.length).to.equal(1);
            // expect log to hold error
            chai.expect(log[0].toString()).to.equal("Something went wrong");

            // complete test with done
            done();
        });
    });

    it("should noop any errors thrown during registration if no error handle is supplied", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create a new instance...
        const readable = new Readable(obj, "", {
            adapters: [{
                register: () => {

                    return new Promise((...[, reject]) => {
                        reject("Something went wrong")
                    });
                }
            }]
        });
        // done when ready
        readable.onReady(function () {

            // complete test with done
            done();
        });
    });

    it("should throw any errors from any onReady fn to the error handler", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create a new instance...
        const readable = new Readable(obj, "", {
            // disable preperation so that we can manually enter isReady state
            prepare: false
        });
        // error thrown by onReady procedure
        readable.onReady(() => {throw(new Error("error"))});
        // mark as ready manually
        try {
            // attempt to ready the method
            readable.ready();
        } catch (err) {
            // not ready if the ready method threw
            chai.expect(readable._isReady).to.equal(null);
            // should produce error
            chai.expect(err.toString()).to.equal("Error: error");
        }

        // complete test with done
        done();
    });

    it("should ignore additional calls to prepare/ready/register after were in ._isReady state", function (done) {
        // create a new instance...
        const readable = new Readable();
        // done when ready
        readable.onReady(function () {
            // calling ready again has no effect
            chai.expect(readable.ready()).to.equal(undefined);
            // calling prepare again has no effect
            chai.expect(readable.prepare()).to.equal(undefined);
            // calling register again has no effect
            chai.expect(readable.register()).to.equal(undefined);

            // complete test with done
            done();
        });
    });

    it("should be preparable given a prepare step via options", function (done) {
        // create a new instance...
        const readable = new Readable({}, "a", {
            // add a prepartion step to fill the target object (this will be called synchronously)
            prepare: function (ready) {
                // fill the target with values
                this._target = Object.assign(this._target, { a: 1 });
                // complete the prepartion (synchronously)
                ready()
            }
        });
        // * note need to wait for onReady...
        const value = readable.raw();
        // expect the fn to be queued but not called
        chai.expect(value).to.equal(1);

        // complete test with done
        done();
    });

    it("should be preparable given a prepare step via options which returns a Promise", function (done) {
        // create a new instance...
        const readable = new Readable({}, "a", {
            // add a prepartion step to fill the target object (this will be called synchronously)
            prepare: function () {

                // return a promise from within the prepare step
                return new Promise((resolve) => {
                    // fill the target with values
                    this._target = Object.assign(this._target, { a: 1 });
                    // complete the prepartion (synchronously)
                    resolve()
                });
            }
        });
        // wait for on ready
        readable.onReady(() => {
            // add a method to the queuedFns queue
            const value = readable.raw();
            // expect the fn to be queued but not called
            chai.expect(value).to.equal(1);

            // complete test with done
            done();
        });
    });

    it("should be preparable given a prepare step via options which returns a Promise which rejects (and logs error)", function (done) {
        // record any errors thrown by construction
        const log = [];
        // create a new instance...
        const readable = new Readable({}, "a", {
            // record any errors thrown during set up (silent apart from this entry point)
            adapters: [{
                adapter: {
                    error: (err) => {
                        log.push(err);
                    }
                }
            }],
            // add a prepartion step to fill the target object (this will be called synchronously)
            prepare: function () {

                // return a promise from within the prepare step
                return new Promise((...[, reject]) => {
                    // fill the target with values
                    this._target = Object.assign(this._target, { a: 1 });
                    // complete the prepartion (synchronously)
                    reject("Something went wrong")
                });
            }
        });
        // wait for onReady
        readable.onReady(() => {
            // add a method to the queuedFns queue
            const value = readable.raw();
            // expect the fn to be queued but not called
            chai.expect(value).to.equal(1);
            // expect a single error on the log
            chai.expect(log.length).to.equal(1);
            // expect log to hold error
            chai.expect(log[0].toString()).to.equal("Something went wrong");

            // complete test with done
            done();
        });
    });

    it("should allow for key generation using parent as guide", function (done) {
        // create a new instance...
        const readable = new Readable(undefined, "");
        // expect the fn to be queued but not called
        chai.expect(readable.key()).to.equal("");
        chai.expect(readable.key("test")).to.equal("test");
        chai.expect(readable.key("test.test")).to.equal("test.test");
        // check that we can nest an instance and retrieve nested keys
        const nested1 = new Readable(readable, "a");
        // get the current key
        chai.expect(nested1.key()).to.equal("a");
        chai.expect(nested1.key("test")).to.equal("a.test");
        chai.expect(nested1.key("test.test")).to.equal("a.test.test");
        // check that nesting is working against * prefixed keys (should maybe extract this to a given prefix?)
        const nested2 = new Readable(nested1, "test");
        // get the current key      
        chai.expect(nested2.key()).to.equal("a.test");
        chai.expect(nested2.key("test")).to.equal("a.test.test");
        chai.expect(nested2.key("test.test")).to.equal("a.test.test.test");
        // move to any position by providing "~" to mark back to the start
        chai.expect(nested2.key("~a.test")).to.equal("a.test");

        // complete test with done
        done();
    });

    it("should allow moving through keys via get", function (done) {
        // set up a test obj
        const obj = { a: { b: { c: 1 } } };
        // create a new instance...
        const readable = new Readable(obj, "a");
        // move the pointers using get
        chai.expect(readable.get().raw(true)).to.equal(obj.a);
        chai.expect(readable.get("b").raw(true)).to.equal(obj.a.b);
        chai.expect(readable.get("b").get("c").raw(true)).to.equal(obj.a.b.c);
        chai.expect(readable.get("b.c").raw(true)).to.equal(obj.a.b.c);

        // complete test with done
        done();
    });

    it("should allow moving through keys via parent (upto the root's position)", function (done) {
        // create a new instance with root key
        const instance = new Readable({ a: [{ b: { c: { d: 1 } } }] }, "a[0]");
        // move to nested position within this object
        const b = instance.get("b");
        const c = b.get("c");
        const d = c.get("d");
        // new instance over instance with additional options
        const a0withOptions = instance.get({option1: true});
        // expect the value to represent current position
        chai.expect(JSON.stringify(d)).to.equal("1");
        // allowing for upwards traversal
        chai.expect(JSON.stringify(d.parent())).to.equal(`{"d":1}`);
        chai.expect(JSON.stringify(d.parent().parent())).to.equal(`{"c":{"d":1}}`);
        // cannot traverse above the root position
        chai.expect(JSON.stringify(d.parent().parent().parent())).to.equal(`{"b":{"c":{"d":1}}}`);
        chai.expect(JSON.stringify(d.parent().parent().parent().parent())).to.equal(`{"b":{"c":{"d":1}}}`);
        chai.expect(JSON.stringify(d.parent().parent().parent().parent().parent())).to.equal(`{"b":{"c":{"d":1}}}`);
        chai.expect(JSON.stringify(d.root())).to.equal(`{"b":{"c":{"d":1}}}`);
        // .parent should also carry options
        chai.expect(d.parent({ test1: true }).parent({ test2: true })._options).to.include({ test1: true, test2: true });
        // options fed through
        chai.expect(a0withOptions._options.option1).to.equal(true);

        // complete test with done
        done();
    });

    it("should allow get to assign options", function (done) {
        // set up a test obj
        const obj = { a: { b: { c: 1 } } };
        // feed immutable option set
        const options = { options0: true };
        // create a new instance (omit passing an initial key)
        const readable = new Readable(obj, options);
        // build up options as we move along the path
        const readablea = readable.get("a", { options1: true })
        const readableb = readablea.get("b", { options2: true })
        const readablec = readableb.get("c", { options3: true });
        // expect all options to be preset on the readablec instance
        chai.expect(readablec._options.options0 && readablec._options.options1 && readablec._options.options2 && readablec._options.options3).to.equal(true);
        // original options are unaltered
        chai.expect(JSON.stringify(options)).to.equal("{\"options0\":true}");

        // complete test with done
        done();
    });

    it("should respond with length if raw is string/array but not number etc", function (done) {
        // expect loose equality length checks on string/array
        // console.log((new Readable([1, 2, 3])).length);
        chai.expect((new Readable([1, 2, 3])).length).to.equal(3);
        chai.expect((new Readable("123")).length == 3).to.equal(true);
        // will respond with false if raw is anything but string/array
        chai.expect((new Readable(123)).length == false).to.equal(true);
        chai.expect((new Readable({ a: 1 })).length == false).to.equal(true);
        chai.expect((new Readable(new Date())).length == false).to.equal(true);

        // complete test with done
        done();
    });

    it("should respond with typeof", function (done) {
        // create an instance with an overide type
        const typed = new Readable([1, 2, 3]);
        // force a type on to the instance
        typed.type = "test";
        // expect typeof to reflect the type property of the readable
        chai.expect(typed.typeof == "test").to.equal(true);
        // expect loose equality typeof checks
        chai.expect((new Readable([1, 2, 3])).typeof == "array").to.equal(true);
        chai.expect((new Readable({ a: 1 })).typeof == "object").to.equal(true);
        chai.expect((new Readable({ a: 1, type: "special"})).typeof == "special").to.equal(true);
        chai.expect((new Readable(new Date())).typeof == "date").to.equal(true);
        chai.expect((new Readable(new ArrayBuffer())).typeof == "arrayBuffer").to.equal(true);
        chai.expect((new Readable(1)).typeof == "number").to.equal(true);
        chai.expect((new Readable("string")).typeof == "string").to.equal(true);

        // complete test with done
        done();
    });

    it("should be serializable", function (done) {
        // expect loose equality typeof checks
        chai.expect(JSON.stringify(new Readable({ a: [1, 2, 3] }))).to.equal("{\"a\":[1,2,3]}");

        // complete test with done
        done();
    });

    it("should get raw value via .raw()", function (done) {
        // expect loose equality typeof checks
        chai.expect(new Readable("string").raw() == "string").to.equal(true);

        // complete test with done
        done();
    });

    it("should allow raw method to be subverted", function (done) {
        const obj = {};
        const str = "string";
        // expect loose equality typeof checks
        chai.expect(new Readable(str, {_raw: {
            fn: () => {

                return "different"
            }
        }}).raw()).to.equal("different");

        // expect the obj to match (every get would get the same value...)
        chai.expect(new Readable(obj, {_raw: {
            fn: () => {

                return obj;
            }
        }}).raw(true)).to.equal(obj);

        // complete test with done
        done();
    });

    it("should reflect raw value in some circumstances", function (done) {
        // expect loose equality typeof checks
        chai.expect(new Readable("string") == "string").to.equal(true);

        // complete test with done
        done();
    });


    it("should allow subversion to take place on prepare", function (done) {
        // create an instance to feed to readable2
        const readable1 = new Readable("string");
        // create an instance that will reflect readable1
        const readable2 = new Readable(123, "", {
            // place an adapter to subvert the instance
            adapters: [
                {
                    register: () => {

                        // return readable1 via adapter
                        return readable1;
                    }
                }
            ]
        })
        // expect loose equality typeof checks
        chai.expect(readable2.raw() == "string").to.equal(true);

        // complete test with done
        done();
    });


});
