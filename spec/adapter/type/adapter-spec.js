// import chai for testing
import chai from 'chai';

// create TypeAdapter against a Writable instance
import { Writable } from "../../../src/internal/writable.js";

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import { TypeAdapter } from "../../../src/internal/adapter/type/adapter.js";

// import error Adapter to handle error cases
import { ErrorAdapter } from "../../../src/internal/adapter/error/adapter.js";

// set-up spec testing feature-set
describe("TypeAdapter ~ from ~ freo/adapter/type", function () {

    it("should register against a Writable instance synchronously", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the TypeAdapter
        const typeAdapter = new TypeAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [typeAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(typeAdapter)).to.equal(0);

        done()
    });

    it("should allow types to be set at keyed positions using type keywords (strings)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the TypeAdapter
        const typeAdapter = new TypeAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [typeAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(typeAdapter)).to.equal(0);
        // for value at "a.b" to be a number
        typeAdapter.set("number", "a.b");
        // set string which will be coerced to number
        writable.get("a.b").set("1");
        // expect coersion
        chai.expect(writable.get("a.b").raw()).to.equal(1);
        // completing the adapter against a target will unsubscribe it (but wont close the adapter)
        writable.complete(typeAdapter);
        // no alterations to types after complete
        typeAdapter.set("string", "a.b");
        // set string which will be coerced to number
        writable.get("a.b").set("2");
        // expect no coersion
        chai.expect(writable.get("a.b").raw()).to.equal("2");

        done()
    });

    it("should ignore type definition if it doesnt match", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, error = null;
        // create an instance of the TypeAdapter
        const typeAdapter = new TypeAdapter({}, "", {
            adapters: [
                {
                    // register an asychronous in front to delay
                    register: () => {
    
                        // this will delay the typeAdapter registration
                        return new Promise((resolve) => {
                            resolve();
                        })
                    }
                },
                new ErrorAdapter((err) => {
                    error = err.toString();
                })
            ]
        });
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [typeAdapter]
        });
        // wait for ready signal from the registered typeAdapter
        writable.onReady(() => {
            // root registered
            chai.expect(writable._adapters.indexOf(typeAdapter)).to.equal(0);
            // for value at "a.b" to be a number
            typeAdapter.set("notpresent", "a.b");
            // expect error
            chai.expect(error).to.equal('TypeError: a.b._type cannot be set to "notpresent"')

            done()
        });
    });

    it("should allow types to be set at keyed positions using type definitions (functions)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the TypeAdapter
        const typeAdapter = new TypeAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [typeAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(typeAdapter)).to.equal(0);
        // for value at "a.b" to be a number
        typeAdapter.set((v) => {

            return (!isNaN(v) ? parseFloat(v) : false);
        }, "a.b");
        // set string which will be coerced to number
        writable.get("a.b").set("1");
        // expect coersion
        chai.expect(writable.get("a.b").raw()).to.equal(1);
        // drop the typeAdapter (but dont close or stop it)
        writable.unsubscribe(typeAdapter);
        // set string which will be coerced to number
        writable.get("a.b").set("2");
        // expect no coersion
        chai.expect(writable.get("a.b").raw()).to.equal("2");
        // register typeAdapter again
        writable.subscribe(typeAdapter);
        // set string which will be coerced to number
        writable.get("a.b").set("3");
        // expect coersion
        chai.expect(writable.get("a.b").raw()).to.equal(3);
        // fully complete the typeAdapter so no new types can be added (but current types persist)
        typeAdapter.complete();
        // set string which will be coerced to number
        writable.get("a.b").set("4");
        // expect no coersion
        chai.expect(writable.get("a.b").raw()).to.equal(4);
        // types are sealed after a complete
        typeAdapter.set((v) => {

            return new String(v).toString();
        }, "a.b");
        // set string which will be coerced to number
        writable.get("a.b").set(5);
        // expect no coersion
        chai.expect(writable.get("a.b").raw()).to.equal(5);
        // unseal so we can unsubscribe
        typeAdapter.isStopped = false;
        // drop the types
        typeAdapter.unsubscribe();
        // closed - wont call again
        typeAdapter.unsubscribe();
        // same with complete
        typeAdapter.complete();
        // set string which will be coerced to number
        writable.get("a.b").set("6");
        // expect no coersion
        chai.expect(writable.get("a.b").raw()).to.equal("6");

        done()
    });

});
