// import chai for testing
import chai from 'chai';

// create MessageAdapter against a Writable instance
import { Writable } from "../../../src/internal/writable.js";

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import { MessageAdapter } from "../../../src/internal/adapter/message/adapter.js";

// set-up spec testing feature-set
describe("MessageAdapter ~ from ~ freo/adapter/message", function () {

    it("should call provided method when an message is sent", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, message = null, send = {};
        // create an instance of the HistoryAdapter
        const messageAdapter = new MessageAdapter((mess) => {
            message = mess;
        });
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: messageAdapter
            }]
        });
        // send a message
        writable.next(send);
        // message was sent
        chai.expect(message).to.equal(send);

        done();
    });

    it("should allow for message handler to be added later", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, message = null, send = {};
        // create an instance of the HistoryAdapter
        const messageAdapter = new MessageAdapter();
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                adapter: messageAdapter
            }]
        });
        // propagate a message
        writable.next(send);
        // message not sent yet
        chai.expect(message).to.not.equal(send);
        // set handler
        messageAdapter._next = (mess) => {
            message = mess;
        };
        // propagate a message
        writable.next(send);
        // message was sent
        chai.expect(message).to.equal(send);

        done();
    });

});
