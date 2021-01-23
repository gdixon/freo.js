// import chai for testing
import chai from 'chai';

// test subject (ServiceWorkerAdapter to link Streamable to Worker)
import { SyncAdapter } from "../../../src/internal/adapter/sync/adapter.js";

// ServiceWorker is an instance of ServiceWorkerAdapter exported as a singleton
import { Sync } from "../../../src/internal/adapter/sync/sync.js";

// set-up spec testing feature-set
describe("Sync ~ from ~ freo/extension", function () {

    it("should import a singleton of the SyncAdapter to be used as a shared Adapter (which syncs with ServiceWorker)", function (done) {
        // ensure the serviceWorkerAdapter is an instance of the ServiceWorkerAdapter
        chai.expect(Sync).to.be.instanceof(SyncAdapter);
        // done on check
        done()
    });

});