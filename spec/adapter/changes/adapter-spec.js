

// import chai for testing
import chai from 'chai';

// create ChangesAdapter against a Writable instance
import { Writable } from "../../../src/internal/writable.js";

// test subject (Record the changes held over against an instance)
import { ChangesAdapter } from "../../../src/internal/adapter/changes/adapter.js";

// set-up spec testing feature-set
describe("ChangesAdapter ~ from ~ freo/extension", function () {

    it("should register against a Writable instance synchronously", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter("", { methods: ["set", "delete"] });
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(changesAdapter)).to.equal(0);
        // method passed through - * note that set and delete are the default methods anyway
        chai.expect(changesAdapter._methods).to.eql(["set", "delete"]);

        done()
    });

    it("should cascade registration through the Writables subordiantes (many HistoryAdapters may exist on a single Writable)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const changesAdapter1 = new ChangesAdapter();
        const changesAdapter2 = new ChangesAdapter();
        const changesAdapter3 = new ChangesAdapter();
        // create new instances...
        const writable1 = new Writable(obj, {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter1]
        });
        // get from the original and add adapters
        const writable2 = writable1.get({ adapters: [changesAdapter2] });
        const writable3 = writable2.get({ adapters: [changesAdapter3] });
        // expect writable3 to hold all adapters
        chai.expect(writable3._adapters).to.eql([changesAdapter1, changesAdapter2, changesAdapter3]);
        
        done()
    });

    it("should register changes from each set/delete onto the instant", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, written = {};
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter({ creationMaxDepth: -1 });
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(changesAdapter)).to.equal(0);
        // set a value
        writable.get("a").set(1);
        writable.get("a").set(2);
        writable.get("a").delete({ written: written})
        // undo methods recorded
        chai.expect(changesAdapter._changes.raw()).to.eql({a: null});
        // expect to have written null on final task
        chai.expect(written).to.eql({a: null});
        done()
    });

    it("should return the most recent changes made to an Object in a flat collection of key->value", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(changesAdapter)).to.equal(0);
        // set a value
        writable.get("a").set(1);
        writable.get("a").set(2);
        writable.get("b").set(1);
        writable.get("b").set(2);
        // undo methods recorded
        chai.expect(changesAdapter.read()).to.eql({
            "a": 2,
            "b": 2
        });

        done()
    });

    it("should return the most recent changes made to an Array in a flat collection of key->value", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = [];
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(changesAdapter)).to.equal(0);
        // set a value
        writable.get("0").set(1);
        writable.get("1").set(2);
        writable.get("2").set(1);
        writable.get("2").delete();
        writable.get("30").set(2);
        // undo methods recorded
        chai.expect(changesAdapter.read()).to.eql({
            "0": 1,
            "1": 2,
            "2": null,
            "30": 2
        });

        done();
    });

    it("should collect the results from setting against a wildcard", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter({methods: ["set", "bogus"]});
        // create a new instance...
        const writable = new Writable(obj, "a|b", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(changesAdapter)).to.equal(0);
        // set a value
        writable.set(1);
        // not recorded
        writable.get("c", { fullKey: true }).set(1);
    
        // undo methods recorded
        chai.expect(changesAdapter.read()).to.eql({
            "a": 1,
            "b": 1
        });

        done();
    });

    it("should collect the results from setting against nested positions", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(changesAdapter)).to.equal(0);
        // set a value
        writable.get("a.b").set(1, { written: [] });
        writable.get("a.c.0").set(1);
        writable.get("a.c.1").set(2);

        // read back the change log
        chai.expect(changesAdapter.read()).to.eql({
            "a.b": 1,
            "a.c.0": 1,
            "a.c.1": 2,
        });

        done();
    });

    it("should stop collecting if we enter inactive state", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(changesAdapter)).to.equal(0);
        // set a value
        writable.get("a").set(1);
        writable.get("a").set(2);
        // stop recording
        changesAdapter.stop();
        // set some values
        writable.get("b").set(1);
        writable.get("b").set(2);
        // undo methods recorded
        chai.expect(changesAdapter.read()).to.eql({
            "a": 2
        });
        // stop recording
        changesAdapter.start();
        // set some values
        writable.get("b").set(1);
        writable.get("b").set(2);
        // undo methods recorded
        chai.expect(changesAdapter.read()).to.eql({
            "a": 2,
            "b": 2
        });

        done()
    });

    it("should clear the changed state on .clear", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(changesAdapter)).to.equal(0);
        // set a value
        writable.get("a").set(1);
        writable.get("a").set(2);
        // stop recording
        changesAdapter.clear();
        // undo methods recorded
        chai.expect(changesAdapter.read()).to.eql({});

        done()
    });

    it("should wait until .ready before recording changes", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const changesAdapter = new ChangesAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [changesAdapter],
            prepare: function() {

                return new Promise((resolve) => {
                    // set initial state
                    this.set({
                        a:1,
                        b:2,
                        c:3
                    });
                    // resolve and continue
                    resolve();
                })
            }
        }).onReady(function () {
            // root registered
            chai.expect(this._adapters.indexOf(changesAdapter)).to.equal(0);
            // set a value
            this.get("a").set(1);
            this.get("a").set(2);
            // console.log("get", this.get("a"));
            this.get("a").set(3);
            // only changed properties recorded
            chai.expect(changesAdapter.read()).to.eql({
                a: 3
            });

            done()
        });
    });

});