// import chai for testing
import chai from 'chai';

// create ErrorAdapter against a Writable instance
import { Writable } from "../../../src/internal/writable.js";

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import { ErrorAdapter } from "../../../src/internal/adapter/error/adapter.js";

// set-up spec testing feature-set
describe("ErrorAdapter ~ from ~ freo/adapter/error", function () {

    it("should call provided method when an error is caught", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, error = null;
        // create an instance of the HistoryAdapter
        const errorAdapter = new ErrorAdapter((err) => {
            error = err;
        });
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: errorAdapter
            }]
        });
        // root registered
        writable.error("error");
        // error was caught
        chai.expect(error).to.eql("error");

        done();
    });

    it("should allow for error handler to be added later", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, error = null;
        // create an instance of the HistoryAdapter
        const errorAdapter = new ErrorAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: errorAdapter
            }]
        });
        // propagate an error
        writable.error("error");
        // error not caught yet
        chai.expect(error).to.not.equal("error");
        // set handler
        errorAdapter._error = (err) => {
            error = err;
        };
        // propagate an error
        writable.error("error");
        // error was caught
        chai.expect(error).to.equal("error");

        done();
    });

});
