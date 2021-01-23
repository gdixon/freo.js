// import chai for testing
import chai from 'chai';

// create GroupAdapter against a Writable instance
import { Writable } from "../../../src/internal/writable.js";

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import { GroupAdapter } from "../../../src/internal/adapter/group/adapter.js";

class DummyAdapter {
    register(target) {
        target.registered++;
    }
    next(m) {
        // incr with each instance of adapter
        m.value = m.value+1;

        // return the whole message
        return m;
    }
};


class DummyError {
    register(target) {
        target.registered++;
    }
    error(m) {
        // incr with each instance of adapter
        m = m+1;

        // return the whole message
        return m;
    }
};

// set-up spec testing feature-set
describe("GroupAdapter ~ from ~ freo/adapter/group", function () {

    it("should register against a Writable instance synchronously", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, registered = false;
        // create an instance of the GroupAdapter
        const groupAdapter = new GroupAdapter([
            {
                register: () => {

                    return new Promise((resolve) => {
                        resolve();
                    });
                }
            }, {
                register: () => {
                    registered = true;
                }
            },
            // nested groups are processed too
            new GroupAdapter()
        ]);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [{
                register: () => {

                    return new Promise((resolve) => {
                        resolve();
                    });
                }
            }, groupAdapter]
        });
        // wait for ready signal
        writable.onReady(() => {
            // root registered
            chai.expect(writable._adapters.indexOf(groupAdapter)).to.equal(1);
            // expect registration to have been called
            chai.expect(registered).to.equal(true);

            done();
        });
    });

    it("should allow Adapters to be grouped and registered to the target via multicasting Adapter", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, message = 0, registered = false;
        // create an instance of the GroupAdapter
        const groupAdapter = new GroupAdapter([{
            register: (target) => {
                target.registered = 1;
            }
        }, DummyAdapter, {
            adapter: DummyAdapter
        }, new DummyAdapter(), {
            adapter: new DummyAdapter()
        }, {
            next: (m) => {
                // final leg set to outer var
                message = m.value;
            }
        }]);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [groupAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(groupAdapter)).to.equal(0);
        // expect both adapters to be registered with target
        chai.expect(writable.registered).to.equal(5);
        // set 1 at a (triggers next on group)
        writable.get("a").set(1);
        // expect to have passed through 4 dummyAdapter instances
        chai.expect(message).to.equal(5);

        // complete test with done
        done()
    });

    it("should allow Adapters to be grouped unsubscribed from the target via multicasting Adapter", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, message = 0;
        // create an instance of the GroupAdapter
        const groupAdapter = new GroupAdapter([{
            register: (target) => {
                target.registered = 1;
            }
        }, DummyAdapter, {
            adapter: DummyAdapter
        }, new DummyAdapter(), {
            adapter: new DummyAdapter()
        }, {
            next: (m) => {
                // final leg set to outer var
                message += m.value;
            }
        }]);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [groupAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(groupAdapter)).to.equal(0);
        // expect both adapters to be registered with target
        chai.expect(writable.registered).to.equal(5);
        // set 1 at a (triggers next on group)
        writable.get("a").set(1);
        // expect to have passed through 4 dummyAdapter instances
        chai.expect(message).to.equal(5);
        // unsubscribe the group
        groupAdapter.unsubscribe();
        groupAdapter.unsubscribe();
        // set another value
        writable.get("a").set(2);
        // exepct message tot to hold one iteration
        chai.expect(message).to.equal(5);


        // complete test with done
        done()
    });

    it("should propagate errors through to the registered adapters on the group", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, error = 0;
        // create an instance of the GroupAdapter
        const groupAdapter = new GroupAdapter([{
            error: (err) => {
                err = 1;

                return err;
            }
        }, {
            adapter: DummyError
        }, {
            error: (err) => {
                chai.expect(err).to.equal(2);
                // add the tot to error
                error += err;
            }
        }]);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [groupAdapter]
        });
        // root registered
        chai.expect(writable._adapters.indexOf(groupAdapter)).to.equal(0);
        // triggers error on group
        writable.error("");
        // complete the groupAdapter
        groupAdapter.complete();
        groupAdapter.complete();
        // does not trigger error on group
        writable.error(""); writable.next({});
        // expect one run through of the error processor
        chai.expect(error).to.equal(2);
        // subscriber the group again
        const next = writable.get("");
        // check absents
        chai.expect(next._adapters.indexOf(groupAdapter)).to.equal(-1);
        // subscribe again
        next.subscribe(groupAdapter);
        // other way round?
        groupAdapter.register(next);
        // expect no group adapter placement
        chai.expect(next._adapters.indexOf(groupAdapter)).to.equal(-1);
        // does not trigger error on group
        writable.error("");
        // expect one run through of the error processor
        chai.expect(error).to.equal(2);

        // complete test with done
        done()
    });

    it("should allow for single adapter to be completed from within", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, completed = false, registered = false, adapter = {
            adapter: {
                register: () => {
                    registered = true;
                },
                complete: () => {
                    completed = true;
                }
            }
        };
        // create an instance of the GroupAdapter
        const groupAdapter = new GroupAdapter([adapter]);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [groupAdapter]
        });
        // wait for ready signal
        writable.onReady(() => {
            // root registered
            chai.expect(writable._adapters.indexOf(groupAdapter)).to.equal(0);
            // expect registration to have been called
            chai.expect(registered).to.equal(true);
            // mark complete
            writable.complete(adapter);
            // check that the complete phase was ran on the provided adapter
            chai.expect(completed).to.equal(true);

            done();
        });
    });


    it("should allow for single GroupAdapter to be unsubscribed from within", function (done) {
        // mark the number of adaptations and check obj is fed as target
        let obj = {}, completed = false, registered = false, adapter = {
            register: () => {
                registered = true;
            },
            complete: () => {
                completed = true;
            }
        };
        // create an instance of the GroupAdapter
        const groupAdapter3 = new GroupAdapter([adapter]);
        const groupAdapter2 = new GroupAdapter([adapter]);
        const group3asAdapter = {adapter: groupAdapter3};
        const groupAdapter1 = new GroupAdapter([groupAdapter2, group3asAdapter]);
        // create a new instance...
        const writable = new Writable(obj, "", {
            // allow entries to be built at any position
            creationMaxDepth: -1,
            // construct array of adapters to alter the behaviour an instance before ready
            adapters: [groupAdapter1]
        });
        // wait for ready signal
        writable.onReady(() => {
            // root registered
            chai.expect(writable._adapters.indexOf(groupAdapter1)).to.equal(0);
            // expect registration to have been called
            chai.expect(registered).to.equal(true);
            // mark complete
            writable.complete(groupAdapter2);
            // drop the groupAdapter3 instance from groupAdapter1
            groupAdapter3.unsubscribe(groupAdapter1, group3asAdapter, groupAdapter3);
            // expect it to be missing
            chai.expect(groupAdapter1._adapters.indexOf(group3asAdapter)).to.equal(-1);
       
            done();
        });
    });
});
