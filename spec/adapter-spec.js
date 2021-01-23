// import chai for testing
import chai from 'chai';

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import { Adapter } from "../src/internal/adapter.js";

// set-up spec testing feature-set
describe("Adapter ~ from ~ freo", function () {

    it("should follow Adapter sequence", function (done) {
        let registered = false, message = false, error = false, completed = false, unsubscribed = false;
        const adapter = new Adapter(() => { registered = true; }, (m) => { message = m; }, (e) => { error = e; }, () => { completed = true; }, () => { unsubscribed = true; })
        adapter.register();
        adapter.next("messaged");
        adapter.error("error");
        adapter.complete();
        chai.expect(message).to.equal("messaged");
        chai.expect(completed).to.equal(true);
        chai.expect(unsubscribed).to.equal(true);
        // complete test with done
        done();
    });


    it("should allow Adapters to extend base", function (done) {
        let registered = false, message = false, error = false, completed = false, unsubscribed = false;
        class test extends Adapter {
            
            _register() { 
                registered = true; 
            }
            
            _next(m) {
                message = m; 
            }
            
            _error(e) {
                error = e; 
            }

            _complete() {
                completed = true; 
            }
            
            _unsubscribe() { 
                unsubscribed = true; 
            }
        }
        // create a new adapter
        const adapter = new test();
        adapter.register();
        adapter.next("messaged");
        adapter.error("error");
        adapter.complete();
        chai.expect(message).to.equal("messaged");
        chai.expect(completed).to.equal(true);
        chai.expect(unsubscribed).to.equal(true);
        // complete test with done
        done();
    });

    it("should remove closed Adapters from the target on register", function(done) {
        // mark the state
        let registered = false, messaged = false, errored = false;
        // construct a simple adapter to hold the case
        const adapter = new Adapter(() => { registered = true; }, () => { messaged = true; }, () => { errored = true; })
        // end the subscription without completing (.closed = true, .isStopped = true)
        adapter.unsubscribe();
        // construct a target which holds the adapter
        const target1 = {_adapters: [adapter]};
        // construct a target which holds the adapter
        const target2 = {_adapters: []};
        // register the closed adapter
        adapter.register(target1, adapter);
        // register the closed adapter
        adapter.register(target2, adapter);
        // registered
        chai.expect(registered).to.equal(false);
        // expect the adapter to have been removed
        chai.expect(target1._adapters.length).to.equal(0);
        // expect the adapter to have never been present
        chai.expect(target2._adapters.length).to.equal(0);
        // send message on closed adapter
        adapter.next({});
        // message doesnt propagate
        chai.expect(messaged).to.equal(false);
        // send error on closed adapter
        adapter.error(new Error());
        // message doesnt propagate
        chai.expect(errored).to.equal(false);


        done();
    });


    it("should allow Adapters to call complete", function(done) {
        let completed = false, unsubscribed = false;
        const adapter = new Adapter(undefined, undefined, undefined, () => { completed = true; }, () => { unsubscribed = true; });
        // complete on the adapter
        adapter.complete();
        // expect complete to have been called
        chai.expect(completed).to.equal(true);
        // expect unsubscribe to have been called
        chai.expect(unsubscribed).to.equal(true);
        // completing doesnt close - but it does stop
        chai.expect(adapter.closed).to.equal(false);
        chai.expect(adapter.isStopped).to.equal(true);
        // complete again skips out (nothing changes)
        adapter.complete();
        
        done();
    });

    it("should allow Adapters to unsubscribe", function(done) {
        let unsubscribed = false;
        const adapter = new Adapter(undefined, undefined, undefined, undefined, () => { unsubscribed = true; });
        // unsub on adapter
        adapter.unsubscribe();
        // expect unsubscribe to have been called
        chai.expect(unsubscribed).to.equal(true);
        // * note that calling unsubscribe with a target will not close the Adapter
        chai.expect(adapter.closed).to.equal(true);
        chai.expect(adapter.isStopped).to.equal(true);
        // unsubscribe again skips out (nothing changes)
        adapter.unsubscribe();

        done();
    });

    it("should allow Adapters to call complete without closing", function(done) {
        let completed = false, unsubscribed = false;
        const adapter = new Adapter(undefined, undefined, undefined, () => { completed = true; }, () => { unsubscribed = true; });
        // assign adapter into a target
        const target1 = {_adapters: [adapter]};
        // complete a single adapter
        adapter.complete(target1, adapter, adapter);
        // adapter not dropped when complete
        chai.expect(target1._adapters.length).to.equal(1);
        // expect complete to have been called
        chai.expect(completed).to.equal(true);
        // expect unsubscribe to have been called
        chai.expect(unsubscribed).to.equal(true);
        
        done();
    });

    it("should allow Adapters to unsubscribe without closing", function(done) {
        let unsubscribed = false;
        const adapter = new Adapter(undefined, undefined, undefined, undefined, () => { unsubscribed = true; });
        // assign adapter into a target
        const target1 = {_adapters: [adapter]};
        // unsub a single adapter
        adapter.unsubscribe(target1, adapter, adapter);
        // adapter dropped when unsubscribe and !complete
        chai.expect(target1._adapters.length).to.equal(0);
        // expect unsubscribe to have been called
        chai.expect(unsubscribed).to.equal(true);
        // * note that calling unsubscribe with a target will not close the Adapter
        chai.expect(adapter.closed).to.equal(false);
        // calling complete now should not make any changes
        adapter.complete(target1, adapter, adapter);
        // not marked
        chai.expect(adapter.closed).to.equal(false);


        done();
    });

    it("should throw through error handler if the next handler throws", function(done) {
        // mark happenings
        let errored = false, unsubscribed = false;
        // construct an adapter and watch the state
        const adapter = new Adapter(undefined, () => { throw(new Error("error")); }, () => { errored = true; }, undefined, () => { unsubscribed = true; });
        // unsub a single adapter
        adapter.next("message");
        // adapter dropped when unsubscribe and !complete
        chai.expect(errored).to.equal(true);
        // expect unsubscribe to have been called
        chai.expect(unsubscribed).to.equal(false);

        done();
    });


    it("should throw through error handler if the copmlete handler throws", function(done) {
        // mark happenings
        let errored = false, unsubscribed = false;
        // construct an adapter and watch the state
        const adapter = new Adapter(undefined, undefined, () => { errored = true; }, () => { throw(new Error("error")); }, () => { unsubscribed = true; });
        // unsub a single adapter
        adapter.complete();
        // adapter dropped when unsubscribe and !complete
        chai.expect(errored).to.equal(true);
        // expect unsubscribe to have been called
        chai.expect(unsubscribed).to.equal(true);

        done();
    });

    it("should attempt to throw through error handler (might not be present) if the unsubscribe handler throws", function(done) {
        // mark happenings
        let unsubscribed = false;
        // construct an adapter and watch the state
        const adapter = new Adapter(undefined, undefined, undefined, undefined, () => { unsubscribed = true; throw(new Error("error")); });
        // unsub a single adapter
        adapter.unsubscribe();
        // expect unsubscribe to have been called
        chai.expect(unsubscribed).to.equal(true);

        done();
    });
    
    it("should throw through error handler if the unsubscribe handler throws", function(done) {
        // mark happenings
        let errored = false, unsubscribed = false;
        // construct an adapter and watch the state
        const adapter = new Adapter(undefined, undefined, () => { errored = true; }, undefined, () => { unsubscribed = true; throw(new Error("error")); });
        // unsub a single adapter
        adapter.unsubscribe();
        // adapter dropped when unsubscribe and !complete
        chai.expect(errored).to.equal(true);
        // expect unsubscribe to have been called
        chai.expect(unsubscribed).to.equal(true);

        done();
    });

});
