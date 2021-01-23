

// import chai for testing
import chai from 'chai';

// test windowTime with sinon (fakerTime tick) 
import sinon from "sinon";

// create HistoryAdapter against a Writable instance
import { Writable } from "../../../src/internal/writable.js";

// test subject (Record the history held over against an instance)
import { HistoryAdapter } from "../../../src/internal/adapter/history/adapter.js";

// expect to be able to clear history items on a schedule (reduce ref-lock)
import { Async } from "@gdixon/fre/scheduler";

// set-up spec testing feature-set
describe("HistoryAdapter ~ from ~ freo/extension", function () {

    it("should register against a Writable instance synchronously", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter({ methods: ["set", "delete"] });
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // root registered
        // chai.expect(historyAdapter._root).to.equal(writable._root);
        // method passed through - * note that set and delete are the default methods anyway
        chai.expect(historyAdapter._methods).to.eql(["set", "delete"]);

        done();
    });


    it("should cascade registration through the Writables subordiantes (many HistoryAdapters may exist on a single Writable)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter1 = new HistoryAdapter();
        const historyAdapter2 = new HistoryAdapter();
        const historyAdapter3 = new HistoryAdapter();
        // create new instances...
        const writable1 = new Writable(obj, {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [historyAdapter1]
        });
        // get from the original and add adapters
        const writable2 = writable1.get({ adapters: [historyAdapter2] });
        const writable3 = writable2.get({ adapters: [historyAdapter3] });
        // expect writable3 to hold all adapters
        chai.expect(writable3._adapters).to.eql([historyAdapter1, historyAdapter2, historyAdapter3]);
        // // expect the root to be set
        // chai.expect(historyAdapter3._root).to.equal(writable1);

        done()
    });

    it("should ignore messages not covered by the registered methods", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter({methods: []});
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        writable.get("a").set(1);
        writable.get("a").set(2);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([]);

        done()
    });

    it("should stop recording messages on unsubscribe (with no target passed in)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // unsubscribe the adapter
        historyAdapter.unsubscribe();
        // set a value
        writable.get("a").set(1);
        writable.get("a").set(2);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([]);

        done()
    });

    it("should clear recorded messages on unsubscribe (with target passed in whose key matches root)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // unsubscribe given a route entry (this will just clear the subjects but will carry on recording?)
        historyAdapter.unsubscribe(writable);
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);

        done()
    });

    it("should carryon recording messages on unsubscribe (with target passed in that doesnt match root)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // unsubscribe given a route entry (this will wont clear the subjects and will carry on recording?)
        historyAdapter.unsubscribe(writable.get("a"));
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);

        done()
    });

    it("should register .undo method from each set/delete onto the left stack", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, written = [], dropped = [];
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        const operation3 = writable.get("a").delete({dropped: dropped, written: written});
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2, operation3]);
        // expect to have dropped value set in operation2
        chai.expect(dropped).to.eql([{
            "a": 2
        }]);
        // expect to have written null
        chai.expect(written).to.eql([{
            "a": null
        }])

        done()
    });

    it("should register .undo method from each set/delete onto the left stack when applied to a Writable", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, written = [], dropped = [];
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        const operation3 = writable.get("a").delete({dropped: dropped, written: written});
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2, operation3]);
        // expect to have dropped value set in operation2
        chai.expect(dropped).to.eql([{
            "a": 2
        }]);
        // expect to have written null
        chai.expect(written).to.eql([{
            "a": null
        }]);
        // carryout unto
        const operation4 = operation3.undo();
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);
        // expect operations to move back onto the left stack after redo
        const operation5 = operation4.redo();
        chai.expect(historyAdapter._left).to.eql([operation1, operation2, operation5]);
        operation5.undo();
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);

        done()
    });

    it("should register .redo method from each .undo to the right stack", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);
        // rewind the modifications
        const operation3 = operation1.undo();
        const operation4 = operation2.undo();
        // expect reqinds on the history
        chai.expect(historyAdapter._right).to.eql([operation3, operation4]);

        done()
    });

    it("should allow the buffer length to be controlled by bufferSize param (eject if bufferSize is exceeded)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter(0);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        writable.get("a").set(1);
        // expect the buffer to only hold on to one undo method (from the most recent set)
        chai.expect(historyAdapter._left).to.eql([writable.get("a").set(2)]);

        done()
    });

    it("should allow the buffer length to be controlled by a scheduler (eject after windowTime)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // want async scheduler to be sandboxed
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        // create an instance of the HistoryAdapter with both a bufferSize and a timeWindow
        const historyAdapter = new HistoryAdapter(0, 5);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        writable.get("a").set(1);
        // set another value and expect the adapter to only the hold undo from that set
        chai.expect(historyAdapter._left).to.eql([writable.get("a").set(2)]);
        // tick the timer
        fakeTimer.tick(5);
        // undo methods dropped
        chai.expect(historyAdapter._left).to.eql([]);
        // drop the sandbox
        sandbox.restore();

        done()
    });

    it("should allow the buffer length to be controlled by a given scheduler (eject after windowTime)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // want async scheduler to be sandboxed
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        // create an instance of the HistoryAdapter with both a bufferSize and a timeWindow
        const historyAdapter = new HistoryAdapter(0, 5, Async, ["set"]);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        writable.get("a").set(1);
        // set another value and expect the adapter to only the hold undo from that set
        chai.expect(historyAdapter._left).to.eql([writable.get("a").set(2)]);
        // tick the timer
        fakeTimer.tick(5);
        // undo methods dropped
        chai.expect(historyAdapter._left).to.eql([]);
        // drop the sandbox
        sandbox.restore();

        done()
    });

    it("should rewind instances state on .undo", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);
        // undo actions
        historyAdapter.undo();
        historyAdapter.undo();
        // empty value rewound
        chai.expect(writable.get("a").raw()).to.equal(undefined);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([]);
        // undo methods recorded
        chai.expect(historyAdapter._right.length).to.eql(2);

        done()
    });

    it("should restore instances undone state on .redo", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, written = [];
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter(1, { methods: ["set", "undo", "redo", "bogus"] });
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);
        // undo both actions 
        historyAdapter.undo();
        // carry out the second undo on the instance itself to retain the redo instrument
        const redo1 = operation1.undo({written: written});
        // expect 1 entries into written
        chai.expect(written.length).to.equal(1);
        // additional undo (calling one too many to bump coverage - no side effects)
        historyAdapter.undo();
        // empty value rewound
        chai.expect(writable.get("a").raw()).to.equal(undefined);
        // redo both actions against the adapter
        historyAdapter.redo();
        historyAdapter.redo();
        // additional redo (calling one too many to bump coverage - no side effects)
        historyAdapter.redo();
        // empty value rewound
        chai.expect(writable.get("a").raw()).to.equal(2);
        // set another
        const operation3 = writable.get("a").set(3);
        // new value
        chai.expect(writable.get("a").raw()).to.equal(3);
        // undo methods recorded
        chai.expect(historyAdapter._left.length).to.eql(2);
        // undo methods recorded
        chai.expect(historyAdapter._right.length).to.eql(0);
        // redo the undo (out of order - this will be treat as a straight forward set)
        const operation4 = redo1.redo({written: written});
        // expect another entry into written
        chai.expect(written.length).to.equal(2);
        // redone - so value is set to 1
        chai.expect(writable.get("a").raw()).to.equal(1);
        // undo methods recorded is still only 2 (because bufferSize dropped the first left)
        chai.expect(historyAdapter._left.length).to.eql(2);
        // undo methods recorded
        chai.expect(historyAdapter._right.length).to.eql(0);
        // expect the operations to be stacked as:
        chai.expect(historyAdapter._left).to.eql([operation3, operation4]);

        done()
    });

    it("should report the length of the full stack at .length", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        // length holds both undos
        chai.expect(historyAdapter.length == 2).to.equal(true);
        // undo against the writable expect history to reflect
        operation1.undo();
        operation2.undo();
        // length is still 2 beacause redos moved over to the right
        chai.expect(historyAdapter.length == 2).to.equal(true);
        // expect none on the left and 2 on the right
        chai.expect(historyAdapter._left.length == 0).to.equal(true);
        chai.expect(historyAdapter._right.length == 2).to.equal(true);

        done()
    });

    it("should rewind all HistoryAdapters that share a root target on any .undo request (pointers/stacks should be positioned correctly)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter1 = new HistoryAdapter();
        const historyAdapter2 = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "a", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter1
            }, historyAdapter2]
        });
        // set a value
        const operation1 = writable.set(1);
        const operation2 = writable.set(2);
        // length holds both undos
        chai.expect(historyAdapter1.length == 2).to.equal(true);
        // undo against the writable expect history to reflect
        operation1.undo();
        operation2.undo();
        // length is still 2 beacause redos moved over to the right
        chai.expect(historyAdapter1.length == 2).to.equal(true);
        chai.expect(historyAdapter2.length == 2).to.equal(true);
        // lengths match
        chai.expect(historyAdapter1._left.length == 0).to.equal(true);
        chai.expect(historyAdapter2._left.length == 0).to.equal(true);
        chai.expect(historyAdapter1._right.length == 2).to.equal(true);
        chai.expect(historyAdapter2._right.length == 2).to.equal(true);

        done()
    });

    it("should restore all HistoryAdapters that share a root target on any .redo request (pointers/stacks should be positioned correctly)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, dropped = {}, written = {};
        // create an instance of the HistoryAdapter
        const historyAdapter1 = new HistoryAdapter();
        const historyAdapter2 = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "a", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter1
            }, historyAdapter2]
        });
        // set some values
        const operation0 = writable.set(1);
        const operation1 = writable.set(2);
        const operation2 = writable.set(3);
        // length reflects the sum of both the undo and redo stacks
        chai.expect(historyAdapter1.length == 3).to.equal(true);
        // undo against the writable out of order expect history to be corrected
        const operation3 = operation0.undo({ written: (written = {}) });
        // expect the value to be on undf
        chai.expect(writable.raw()).to.equal(undefined);
        // clears the left and pushes to right expect the length to be 1
        chai.expect(historyAdapter1.length == 1).to.equal(true);
        // expect it to propagate in all places
        chai.expect(historyAdapter1._left.length == 0).to.equal(true);
        chai.expect(historyAdapter2._left.length == 0).to.equal(true);
        chai.expect(historyAdapter1._right.length == 1).to.equal(true);
        chai.expect(historyAdapter2._right.length == 1).to.equal(true);
        // options are fed into the operation
        const operation4 = operation1.undo({ dropped: (dropped = {}) }); // sets us to 1
        // expect the value to be on 1
        chai.expect(writable.raw()).to.equal(1);
        // expect dropped items to match...
        chai.expect(dropped).to.eql({ "a": undefined });
        // length is 2 beacause both redos moved over to the right
        chai.expect(historyAdapter1.length == 2).to.equal(true);
        chai.expect(historyAdapter2.length == 2).to.equal(true);
        // lengths match
        chai.expect(historyAdapter1._left.length == 0).to.equal(true);
        chai.expect(historyAdapter2._left.length == 0).to.equal(true);
        chai.expect(historyAdapter1._right.length == 2).to.equal(true);
        chai.expect(historyAdapter2._right.length == 2).to.equal(true);
        // value is currently at 1
        chai.expect(writable.raw()).to.equal(1);
        // redo the undone work (this will redo operation1 setting 1 -- already in that state so expect the message to be dropped)
        operation3.redo();
        // expect the value to be on 1
        chai.expect(writable.raw()).to.equal(1);
        // options are fed into the operation
        operation4.redo({ dropped: (dropped = {}) });
        // expect the value to be on 2
        chai.expect(writable.raw()).to.equal(2);
        // expect dropped items to match...
        chai.expect(dropped).to.eql({ "a": 1 });
        // lengths match
        chai.expect(historyAdapter1._left.length == 1).to.equal(true);
        chai.expect(historyAdapter2._left.length == 1).to.equal(true);
        chai.expect(historyAdapter1._right.length == 0).to.equal(true);
        chai.expect(historyAdapter2._right.length == 0).to.equal(true);
        // expect to go back again
        historyAdapter1.undo();
        // lengths match
        chai.expect(historyAdapter1._left.length == 0).to.equal(true);
        chai.expect(historyAdapter2._left.length == 0).to.equal(true);
        chai.expect(historyAdapter1._right.length == 1).to.equal(true);
        chai.expect(historyAdapter2._right.length == 1).to.equal(true);
        // expect to go back again
        const operation5 = historyAdapter1.redo();
        // lengths match
        chai.expect(historyAdapter1._left.length == 1).to.equal(true);
        chai.expect(historyAdapter2._left.length == 1).to.equal(true);
        chai.expect(historyAdapter1._right.length == 0).to.equal(true);
        chai.expect(historyAdapter2._right.length == 0).to.equal(true);
        // expect the value to be on 2
        chai.expect(writable.raw()).to.equal(2);
        // clear the adapters
        historyAdapter1.clear();
        // redo operation4 - should be dropped from history
        operation4.redo();
        // writable is still 2
        chai.expect(writable.raw()).to.equal(2);
        // wtttf
        chai.expect(historyAdapter1._right.length == 0).to.equal(true);
        chai.expect(historyAdapter2._right.length == 0).to.equal(true);
        // set to 2 again via undo
        operation2.undo();
        // writable is still 2
        chai.expect(writable.raw()).to.equal(2);
        // lengths match
        chai.expect(historyAdapter1._left.length == 0).to.equal(true);
        chai.expect(historyAdapter2._left.length == 1).to.equal(true);
        chai.expect(historyAdapter1._right.length == 0).to.equal(true);
        chai.expect(historyAdapter2._right.length == 0).to.equal(true);

        done()
    });

    it("should register against a wildcard key and only record alterations made at matching positions", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {
            a: {
                b: 3
            }
        };
        // create an instance of the HistoryAdapter
        const historyAdapter1 = new HistoryAdapter();
        const historyAdapter2 = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter1
            }]
        });
        // get keyed poisition and attach second history adapter
        const writable2 = writable.get("a.b|c", { adapters: [historyAdapter2] });
        // set a value
        const operation1 = writable2.set(1);
        // should set the operation but wont be record in historyAdapter2
        const operation2 = writable2.get("c.d", { fullKey: true }).set(2);
        // undo methods recorded
        chai.expect(historyAdapter1._left).to.eql([operation1, operation2]);
        // undo methods recorded
        chai.expect(historyAdapter2._left).to.eql([operation1]);

        done()
    });

    it("should register a flat key and record history made by wildcarded subordinate", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter1 = new HistoryAdapter();
        const historyAdapter2 = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter1
            }]
        });
        // get keyed poisition and attach second history adapter
        const writable2 = writable.get("a.b", { adapters: [historyAdapter2] });
        // set a value
        const operation1 = writable2.set(1);
        // should set the operation but wont be record in historyAdapter2
        const operation2 = writable.get("a.c|d", { fullKey: true }).set(2);
        // undo methods recorded
        chai.expect(historyAdapter1._left).to.eql([operation1, operation2]);
        // undo methods recorded
        chai.expect(historyAdapter2._left).to.eql([operation1]);
        // // expect only one entrant on the a.b because it cannot see the historyAdapter2
        operation2.undo();
        // undo methods update
        chai.expect(historyAdapter1._left).to.eql([operation1]);
        // undo methods stayed the same
        chai.expect(historyAdapter2._left).to.eql([operation1]);

        done()
    });

    it("should allow the history buffer to be .clear'ed externally", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value
        const operation1 = writable.get("a").set(1);
        const operation2 = writable.get("a").set(2);
        // undo methods recorded
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);
        // clear the history
        historyAdapter.clear();
        // empty buffer
        chai.expect(historyAdapter._left).to.eql([]);

        done()
    });

    it("should allow transactions to be free from the original HistoryAdapter", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter
            }]
        });
        // set a value - ** note that the transaction still receives the adapters associated with the feeding target but they dont register because the root target is different
        const operation1 = writable.get("a").transaction(function () {
            // expect this operation to not be committed to any history obj
            this.set(1);
            // undo methods recorded
            chai.expect(historyAdapter._left).to.eql([]);
        });
        // carryout another set via transaction
        const operation2 = writable.get("a").transaction(function () {
            // expect this operation to not be committed to any history obj
            this.set(2);
            // undo methods recorded
            chai.expect(historyAdapter._left).to.eql([operation1]);
        });
        // undo methods recorded from both transactions
        chai.expect(historyAdapter._left).to.eql([operation1, operation2]);

        done()
    });

    it("should allow transactions to hold their own historyAdapter that work independent from source", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const historyAdapter1 = new HistoryAdapter();
        const historyAdapter2 = new HistoryAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: historyAdapter1
            }]
        });
        // set a value inside a transaction and manipulate with the supplied historyAdapter
        const operation1 = writable.get("a").transaction(function () {
            // expect the operation to be present on adapter2 but not 1
            const op1 = this.set(1);
            // historyAdapter1 does not see the record until its committed
            chai.expect(historyAdapter1._left).to.eql([]);
            // historyAdapter2 will hold the undo method associated with op1 
            chai.expect(historyAdapter2._left).to.eql([op1]);
            // undo on the adapter
            historyAdapter2.undo();
            // when undone the item is dropped
            chai.expect(historyAdapter2._left).to.eql([]);
            // redo on the adapter adds a new item to the left - it is equivalent but not equal to the original op1._undo
            historyAdapter2.redo();
            // historyAdapter2 will hold the record
            chai.expect(historyAdapter2._left.length).to.eql(1);
        }, {
            // feed adapter and ref inside (written to the transaction instance)
            adapters: [historyAdapter2]
        });
        // carryout another set via transaction
        const operation2 = writable.get("a").transaction(function () {
            // expect the operation to be present on adapter2 but not 1
            const op1 = this.set(2);
            // previous op from last transaction is present...
            chai.expect(historyAdapter1._left).to.eql([operation1]);
            // historyAdapter supplied will hold the record and can be accessed here...
            chai.expect(this._adapters[this._adapters.length - 1]._left).to.eql([op1]);
        }, {
            // feed adapter and ref inside (written to the transaction instance)
            adapters: [new HistoryAdapter()]
        });
        // both undo methods from both transactions are recorded...
        chai.expect(historyAdapter1._left).to.eql([operation1, operation2]);

        done()
    });

});