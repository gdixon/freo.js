

// import chai for testing
import chai from 'chai';

// create CacheAdapter against a Writable instance
import { Writable } from "../../../src/internal/writable.js";

// test subject (Record the changes held over against an instance)
import { CacheAdapter } from "../../../src/internal/adapter/cache/adapter.js";

// set-up spec testing feature-set
describe("CacheAdapter ~ from ~ freo/extension", function () {

    it("should register against a Writable instance synchronously", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the CacheAdapter
        const cacheAdapter = new CacheAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [cacheAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(cacheAdapter)).to.equal(0);

        done()
    });

    it("should cascade registration through the Writables subordiantes (many HistoryAdapters may exist on a single Writable)", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {};
        // create an instance of the HistoryAdapter
        const cacheAdapter1 = new CacheAdapter();
        const cacheAdapter2 = new CacheAdapter();
        const cacheAdapter3 = new CacheAdapter();
        // create new instances...
        const writable1 = new Writable(obj, {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [cacheAdapter1]
        });
        // get from the original and add adapters
        const writable2 = writable1.get({ adapters: [cacheAdapter2] });
        const writable3 = writable2.get({ adapters: [cacheAdapter3] });
        // expect writable3 to hold all adapters
        chai.expect(writable3._adapters).to.eql([cacheAdapter1, cacheAdapter2, cacheAdapter3]);
        
        done()
    });

    it("should register changes from each set/delete onto the instant", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, written = {};
        // create an instance of the HistoryAdapter
        const cacheAdapter = new CacheAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [cacheAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(cacheAdapter)).to.equal(0);
        // set a value
        writable.get("a").set(1);
        // expect cache to hold new value
        chai.expect(cacheAdapter.get("a")).to.equal(1);
        // set another
        const op = writable.get("a").set(2);
        // expect value to be replaced
        chai.expect(cacheAdapter.get("a")).to.equal(2);
        // reverse the action
        op.undo();
        // expect cache to hold prev value
        chai.expect(cacheAdapter.get("a")).to.equal(1);
        // delete the value
        writable.get("a").delete({ written: written})
        // expect to have written null on final task
        chai.expect(written).to.eql({a: null});
        // expect cached item to be cleared
        chai.expect(cacheAdapter.get("a")).to.equal(undefined);
        // set another
        writable.get("a").set(3);
        // expect value to be replaced
        chai.expect(cacheAdapter.get("a")).to.equal(3);
        // unsubscribe the adapter
        cacheAdapter.unsubscribe("a");
        // expect cached item to be cleared
        chai.expect(cacheAdapter.get("a")).to.equal(undefined);
        // set another
        writable.get("a.b").set(4);
        // expect value to be replaced
        chai.expect(cacheAdapter.get("a.b")).to.equal(4);
        // make a wildcard to warm the cache
        chai.expect(writable.get("a.*").raw()).to.eql({'a.b': 4});
        // expect value to be replaced
        chai.expect(cacheAdapter.get("a.*", true)).to.eql({'a.b': 4});
        // unsubscribe the adapter
        cacheAdapter.unsubscribe(writable);
        // expect cached item to be cleared
        chai.expect(cacheAdapter.get("a")).to.equal(undefined);

        done()
    });

});