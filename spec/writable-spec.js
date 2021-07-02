// import chai for testing
import chai from 'chai';

// test subject (Writable is a Readable with set and delete methods)
import { Writable } from "../src/internal/writable.js";


// set-up spec testing feature-set
describe("Writable ~ from ~ freo", function () {

    it("should respond to .toString with [object Writable] type", function (done) {
        // create a new instance...
        const writable = new Writable({}, {});
        // get the scope value from the instance
        chai.expect(writable.toString()).to.equal("[object Writable]");

        // complete test with done
        done();
    });

    it("should allow get operations on the Writable instance", function (done) {
        // check that the target is fed through by reference
        const obj = {
            "scope": {
                a: 1
            }
        };
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // calling init again has no effect
        writable.init();
        // get the scope value from the instance
        chai.expect(writable.get("scope").raw(true)).to.equal(obj.scope);

        // complete test with done
        done();
    });

    it("should allow set operations on the Writable instance where root target starts undefined", function (done) {
        // create a new instance...
        const writable = new Writable(undefined, "", {}), dropped = [];
        // move to string
        writable.set("test");
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.equal(undefined);
        // move to string
        const operation = writable.set("test", {
            dropped: dropped,
            replaceRoot: true
        });
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.equal("test");
        // expect the dropped to cover the old state
        chai.expect(dropped).to.eql([{
            "": undefined
        }]);
        // revert the operation
        operation.undo();
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.equal(undefined);

        // complete test with done
        done();
    });

    it("should allow set operations on the Writable instance as mutable", function (done) {
        // root obj 
        const obj = {};
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // perform set 
        writable.get("scope").set({
            a: 1
        });
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.get("scope").raw())).to.equal("{\"a\":1}");
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.equal(obj);

        // complete test with done
        done();
    });

    it("should allow set operations on the Writable instance as immutable", function (done) {
        // root obj
        const obj = {};
        // create a new instance...
        const writable = new Writable(obj, "", {
            immutable: true
        });
        // perform set 
        writable.get("scope").set({
            a: 1
        });
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.get("scope").raw())).to.equal("{\"a\":1}");
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.not.equal(obj);
        // complete test with done
        done();
    });

    it("should allow undo/redo operations after a set which changed the type on its branch", function (done) {
        // create a new instance...
        const writable = new Writable({ a: { b: 1 } }, "", { immutable: true });
        // perform delete on unrecognised key
        const operation = writable.get("a").set([1]);
        // get the scope value from the instance (should be undefined)
        chai.expect(writable.raw()).to.eql({ a: [1] });
        // undo the operation
        const undone = operation.undo();
        // expect the undo operation to return the value state
        chai.expect(writable.raw()).to.eql({ a: { b: 1 } });
        // redo what was undone
        undone.redo();
        // expect the undo operation to return the value state
        chai.expect(writable.raw()).to.eql({ a: [1] });
        
        // complete test with done
        done();
    });

    it("should allow undo operations after a set which changed the type on its branch with mutable targets", function (done) {
        // create a new instance...
        const writable = new Writable({ a: { b: 1 } });
        // perform delete on unrecognised key
        const operation = writable.get("a").set([1]);
        // get the scope value from the instance (should be undefined)
        chai.expect(writable.raw()).to.eql({ a: [1] });
        // undo the operation
        operation.undo();
        // expect the undo operation to return the value state
        chai.expect(writable.raw()).to.eql({ a: { b: 1 } });

        // complete test with done
        done();
    });

    it("should allow undo operations after a set which merged values into the immutable target set", function (done) {
        // create a new instance...
        const writable = new Writable({ a: { b: 1 } }, "", { immutable: true });
        // perform delete on unrecognised key
        const operation = writable.get("a").set([1], undefined, { merge: true });
        // get the scope value from the instance (should be undefined)
        chai.expect(writable.raw()).to.eql({ a: { 0: 1, b: 1 } });
        // undo the operation
        operation.undo();
        // expect the undo operation to return the value state
        chai.expect(writable.raw()).to.eql({ a: { b: 1 } });

        // complete test with done
        done();
    });

    it("should allow undo operations after a set which merged values into the mutable target set", function (done) {
        // create a new instance...
        const writable = new Writable({ a: { b: 1 } });
        // perform delete on unrecognised key
        const operation = writable.get("a").set([1], undefined, { merge: true });
        // get the scope value from the instance (should be undefined)
        chai.expect(writable.raw()).to.eql({ a: { 0: 1, b: 1 } });
        // undo the operation
        operation.undo();
        // expect the undo operation to return the value state
        chai.expect(writable.raw()).to.eql({ a: { b: 1 } });

        // complete test with done
        done();
    });

    it("should disallow set operations on mutable Writable instance if it would change the reference at root", function (done) {
        // create a new instance...
        const writable = new Writable("string", "", {});
        // perform set 
        writable.set({
            a: 1
        });
        // get the scope value from the instance
        chai.expect(writable.raw()).to.equal("string");

        // complete test with done
        done();
    });

    it("should allow set operations on mutable Writable instance if it would change the reference at root so long as 'replaceRoot' is passed as an option", function (done) {
        // create a new instance...
        const writable = new Writable("string", "", {});
        // perform set agaist the root with replaceRoot: true
        writable.set({
            a: 1
        }, undefined, {
            replaceRoot: true
        });
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.raw())).to.equal("{\"a\":1}");

        // complete test with done
        done();
    });

    it("should allow set operations on nested keys within the Writable instance", function (done) {
        // check the suppliec object is mutated accordingly
        const obj = {
            "scope": {
                a: 1
            }
        };
        // create a new instance...
        const writable = new Writable(obj, "scope", {});
        // perform set 
        writable.set(2, "a");
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.get("a").raw())).to.equal("2");
        // perform set using the full key definition
        writable.set(3, "~scope.a");
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.get("a").raw())).to.equal("3");

        // complete test with done
        done();
    });

    it("should allow set to undefined operation on the root of Writable instance (and back again)", function (done) {
        // ensure that the root target value can only be cleared and not deleted
        const obj = { a: 1, b: 2 };
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // perform set of undefined to cause obj to be mutably cleared
        const operation = writable.get().set();
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.get().raw())).to.equal("{}");
        // obj should have been altered as mutable
        chai.expect(obj).to.equal(writable.get().raw(true));
        // revert the action (using the original shallow clone of the original value set)
        operation.undo();
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.get().raw())).to.equal("{\"a\":1,\"b\":2}");
        // obj should have been altered as mutable
        chai.expect(obj).to.equal(writable.get().raw(true));

        // complete test with done
        done();
    });

    it("should allow mutable roots at the top of an immutable structure", function (done) {
        // ensure that the root target value can only be cleared and not deleted
        const obj1 = { a: 1, b: 2 }, obj2 = { a: 1, b: 2 };
        // create a new instance...
        const writable1 = new Writable(obj1, "", {});
        // create a new instance...
        const writable2 = new Writable(obj2, "", {});
        // perform set to different object type but mutable root will cause type to be lost
        writable1.set([1, 2, 3], undefined, {
            immutable: true,
            replaceRoot: false,
        });
        // same set but with merge will retain the original values on the root
        writable2.set([1, 2, 3], undefined, {
            immutable: true,
            replaceRoot: false,
            merge: true
        });
        // get the scope value from the instance
        chai.expect(obj1).to.equal(writable1.raw(true));
        // get the scope value from the instance
        chai.expect(JSON.stringify(obj1)).to.equal(`{"0":1,"1":2,"2":3}`);
        // get the scope value from the instance
        chai.expect(obj2).to.equal(writable2.raw(true));
        // get the scope value from the instance
        chai.expect(JSON.stringify(obj2)).to.equal(`{"0":1,"1":2,"2":3,"a":1,"b":2}`);

        // complete test with done
        done();
    });

    it("should allow immutable roots at the top of a mutable structure", function (done) {
        // ensure that the root target value can only be cleared and not deleted
        const obj = { a: 1, b: 2 };
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // perform set of undefined to cause obj to be mutably cleared
        writable.get().set([1, 2, 3], undefined, {
            immutable: false,
            replaceRoot: true
        });
        // get the scope value from the instance
        chai.expect(obj).to.not.equal(writable.get().raw(true));
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.get().raw(true))).to.equal(`[1,2,3]`);
        // get the scope value from the instance
        chai.expect(JSON.stringify(obj)).to.equal(`{"a":1,"b":2}`);

        // complete test with done
        done();
    });

    it("should allow set operation with merge on the Writable instance as mutable", function (done) {
        // root obj 
        const obj = {
            a: 1
        };
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // perform set 
        writable.set({
            b: 1,
            c: 1
        }, undefined, {
            merge: true
        });
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.raw())).to.equal("{\"a\":1,\"b\":1,\"c\":1}");
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.equal(obj);

        // complete test with done
        done();
    });

    it("should allow set operation with merge on the Writable instance as immutable", function (done) {
        // root obj 
        const obj = {
            a: 1
        };
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // perform set 
        writable.set({
            b: 1,
            c: 1
        }, undefined, {
            merge: true,
            immutable: true
        });
        // expect the object to be untouched
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // get the scope value from the instance
        chai.expect(JSON.stringify(writable.raw())).to.equal("{\"a\":1,\"b\":1,\"c\":1}");
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.not.equal(obj);

        // complete test with done
        done();
    });

    it("should allow delete operations on the Writable instance as immutable", function (done) {
        let messaged = 0;
        // root obj
        const obj = {};
        // create a new instance...
        const writable = new Writable(obj, "", {
            immutable: true
        });
        // perform set 
        writable.get("scope").set({
            a: 1
        });
        // check the scope obj is also different
        const scope = writable.get("scope").raw(true);
        // delete the value we set
        writable.get("scope.a").delete();
        // get the scope value from the instance
        chai.expect(writable.get("scope.a").raw()).to.equal(null);
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.not.equal(obj);
        // get the scope value from the instance
        chai.expect(writable.get("scope").raw(true)).to.not.equal(scope);
        // set-up again
        writable.get("scope.a").set(1);
        // check that the skipMessage option is fed through to Adapters
        writable.get("scope.a", {
            adapters: [{
                register: () => {},
                next: (message) => {
                    if (message.skipMessage) {
                        messaged++;
                    }
                }
            }]
        }).delete({skipMessage: {src: "test"}});
        // expect messaged to have incrd
        chai.expect(messaged).to.equal(1);
        
        // complete test with done
        done();
    });

    it("should allow delete operations on the Writable instance as mutable", function (done) {
        // root obj 
        const obj = {};
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // perform set 
        writable.get("scope").set({
            a: 1
        });
        // check the scope obj is also different
        const scope = writable.get("scope").raw(true);
        // delete the value we set
        writable.get("scope.a").delete();
        // get the scope value from the instance
        chai.expect(writable.get("scope.a").raw()).to.equal(null);
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.equal(obj);
        // get the scope value from the instance
        chai.expect(writable.get("scope").raw(true)).to.equal(scope);

        // complete test with done
        done();
    });

    it("should not allow delete operations on the Writable instances root if the operation would change the type (mutable)", function (done) {
        // create a new instance...
        const writable = new Writable("string", "", {});
        // attempt to perform delete on root key
        writable.delete();
        // get the scope value from the instance (should be undefined)
        chai.expect(writable.raw()).to.equal("string");

        // complete test with done
        done();
    });

    it("should allow delete operations on the Writable instances root if the operation would change the type (immutable)", function (done) {
        // create a new instance...
        const writable = new Writable("string", "", {
            immutable: true
        });
        // attempt to perform delete on root key
        writable.delete();
        // get the scope value from the instance (should be undefined)
        chai.expect(writable.raw()).to.equal(null);

        // complete test with done
        done();
    });

    it("should not allow delete operations on the Writable instances when the key doesnt match any values", function (done) {
        // create a new instance...
        const writable = new Writable("string", "", {});
        // perform delete on unrecognised key
        writable.delete("a.b.c");
        // get the scope value from the instance (should be undefined)
        chai.expect(writable.raw()).to.equal("string");

        // complete test with done
        done();
    });


    it("should allow delete operations on the Writable instances root if the operation would change the type when \"replaceRoot\" is provided", function (done) {
        // create a new instance...
        const writable1 = new Writable("string", "", {});
        // create a new instance...
        const writable2 = new Writable("string", "", {});
        // perform delete passing replaceRoot -- this will be accepted 
        writable1.delete({ replaceRoot: true });
        // perform delete against nested key on a Writable that doesnt have nested key -- wont be accepted
        writable2.delete("a.b.c", { replaceRoot: true });
        // get the scope value from the instance (should be undefined)
        chai.expect(writable1.raw()).to.equal(null);
        // expect writable2 to have been mutated to an object
        chai.expect(writable2.raw()).to.eql({});

        // complete test with done
        done();
    });

    it("should allow delete operations on the Writable instance against multiple matching entries to be reveresed with undo", function (done) {
        // this obj will be mutated by the Writable operations
        const obj = {
            "scope": [{
                b: 1
            }, {
                a: 1
            }, {
                a: 2
            }]
        };
        // create a new instance...
        const writable = new Writable(obj, "scope.*.a", {
            allMatches:true, 
            creationMaxDepth: "0"
        });
        // perform delete
        const deletion = writable.delete();
        // get the scope value from the instance (should be undefined)
        chai.expect(JSON.stringify(obj, (key, value) => {
            if (value !== null) return value
        })).to.equal(`{"scope":[{"b":1},{},{}]}`);
        // undo the previous event
        deletion.undo();
        // operation should return the values to the original obj
        chai.expect(JSON.stringify(obj)).to.equal(`{"scope":[{"b":1},{"a":1},{"a":2}]}`);

        // complete test with done
        done();
    });

    it("should allow delete operations on the Writable instance against multiple matching entries when delete is given a key", function (done) {
        // this obj will be mutated by the Writable operations
        const obj = {
            "scope": [{
                b: 1
            }, {
                a: { b: 1 }
            }, {
                a: { b: 1 }
            }]
        };
        // create a new instance...
        const writable = new Writable(obj, "scope", {});
        // perform delete where property creation at depth is disallowed (scope.*.a.b)
        writable.delete("*.a.b", { allMatches:true, creationMaxDepth: 0 });
        // then delete all of a (scope.*.a)
        writable.delete("*.a", { allMatches:true });
        // get the scope value from the instance (should be undefined)
        chai.expect(JSON.stringify(obj, (key, value) => {
            if (value !== null) return value
        })).to.equal(`{"scope":[{"b":1},{},{}]}`);

        // complete test with done
        done();
    });

    // it("should allow type definitions to be set on the Writable instance and to be enforced", function (done) {
    //     // root obj 
    //     const obj = {};
    //     // create a new instance...
    //     const writable = new Writable(obj, "", { typesafe: true });
    //     // perform set 
    //     writable.get("str").setType("string");
    //     // set a number and coerce to string
    //     writable.get("str").set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.get("str").raw(true)).to.equal("2");
    //     // set a number and coerce to string
    //     writable.get("str").set(1, undefined, { typesafe: false });
    //     // get the scope value from the instance
    //     chai.expect(writable.get("str").raw(true)).to.equal(1);

    //     // complete test with done
    //     done();
    // });

    // it("should allow type definitions to be set on nested positions in the Writable instance", function (done) {
    //     // root obj (being modified as mutable)
    //     const obj = { a: {} };
    //     // create a new instance...
    //     const writable = new Writable(obj, "", { typesafe: true, creationMaxDepth: 1 });
    //     // set type to cast String for any keys matching a.**.b (ie a.b or a.c.b or a[0].b or a[0].c.b)
    //     writable.get("a").setType("string", "**.b");
    //     // set a number and coerce to string
    //     writable.get("a.b").set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.get("a.b").raw(true)).to.equal("2");
    //     // set a number and coerce to string at nested position on the set side
    //     writable.get("a").set({ c: { b: 1 } });
    //     // get the scope value from the instance
    //     chai.expect(writable.get("a.c.b").raw(true)).to.equal("1");
    //     // set a number and coerce to string
    //     writable.get("a.b").set(1, undefined, { typesafe: false });
    //     // get the scope value from the instance
    //     chai.expect(writable.get("a.b").raw(true)).to.equal(1);

    //     // complete test with done
    //     done();
    // });

    // it("should allow type definitions to be deleted from nested positions in the Writable instance", function (done) {
    //     // root obj 
    //     const obj = { a: {} };
    //     // create a new instance...
    //     const writable = new Writable(obj, "", { typesafe: true, creationMaxDepth: 1 });
    //     // perform delete on types before intialisation (side affect free)
    //     writable.get("a").deleteType("b");
    //     // perform set 
    //     writable.get("a").setType("string", "b");
    //     // set a number and coerce to string
    //     writable.get("a.b").set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.get("a.b").raw(true)).to.equal("2");
    //     // set a number and coerce to string
    //     writable.get("a.b").set(1, undefined, { typesafe: false });
    //     // get the scope value from the instance
    //     chai.expect(writable.get("a.b").raw(true)).to.equal(1);
    //     // perform delete
    //     writable.get("a").deleteType("b");
    //     // set a number and coerce to string
    //     writable.get("a.b").set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.get("a.b").raw(true)).to.equal(2);

    //     // complete test with done
    //     done();
    // });

    // it("should allow type definitions to be set on the root of the Writable instance as shorthand alias'", function (done) {
    //     // root obj 
    //     const obj = {};
    //     // create a new instance...
    //     const writable = new Writable(obj, "", { typesafe: true, replaceRoot: true });
    //     // root as object
    //     writable.setType("array");
    //     // force every entry to be a string
    //     writable.get("*").setType("string");
    //     // force every entry to be a string
    //     writable.get("3|4").setType("number");
    //     // set a number will set root to undf
    //     writable.set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.raw(true)).to.eql(undefined);
    //     // set to array - numbers will be coreced to strings obj will be set to undf
    //     writable.set([1, 2, 3, { a: 1 }, 5]);
    //     // get the value from the instance - expect each entry to be a string
    //     chai.expect(writable.raw(true)).to.eql(["1", "2", "3", undefined, 5]);
    //     // pulling values by wildcarded key will only include those which hold value
    //     chai.expect(writable.get("*").raw(true)).to.eql(["1", "2", "3", 5]);
    //     // check for values at position 3 or 4
    //     chai.expect(writable.get("3|4").raw(true)).to.eql([5]);
    //     // set 4 into position 3
    //     writable.set("4", "3");
    //     // check for values at position 3 or 4
    //     chai.expect(writable.get("3|4").raw(true)).to.eql([4,5]);
    //     // delete the root type
    //     writable.deleteType({});
    //     // set a number onto the root type (which has no props)
    //     writable.set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.raw(true)).to.equal(2);

    //     // complete test with done
    //     done();
    // });

    // it("should allow type definitions to be set on the root of the Writable instance as a method", function (done) {
    //     // root obj 
    //     const obj = "string";
    //     // create a new instance...
    //     const writable = new Writable(obj, "", { typesafe: true, replaceRoot: true });
    //     // perform set 
    //     writable.setType((v) => {

    //         return (new String(v)).toString();
    //     });
    //     // set a number and coerce to string
    //     writable.set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.raw(true)).to.equal("2");
    //     // set a number and coerce to string
    //     writable.set(1, undefined, { typesafe: false });
    //     // get the scope value from the instance
    //     chai.expect(writable.raw(true)).to.equal(1);

    //     // complete test with done
    //     done();
    // });

    // it("should allow type definitions to be removed after being added using returned method", function (done) {
    //     // root obj 
    //     const obj = "string";
    //     // check for the type being dropped
    //     const dropped = {};
    //     // create a new instance...
    //     const writable = new Writable(obj, "", { typesafe: true, replaceRoot: true });
    //     // record the type
    //     const type = (v) => {

    //         return (new String(v)).toString();
    //     };
    //     // perform set 
    //     const stringType = writable.setType(type);
    //     // set a number and coerce to string
    //     writable.set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.raw(true)).to.equal("2");
    //     // set a number and coerce to string
    //     writable.set(1, undefined, { typesafe: false });
    //     // get the scope value from the instance
    //     chai.expect(writable.raw(true)).to.equal(1);
    //     // delete the type
    //     stringType.delete({
    //         dropped: dropped,
    //     });
    //     // expect to have dropped the type
    //     chai.expect(dropped).to.eql({
    //         _type: {
    //             fn: type,
    //             weight: 0
    //         }
    //     });
    //     // set a number
    //     writable.set(2);
    //     // get the scope value from the instance
    //     chai.expect(writable.raw(true)).to.equal(2);
    //     // complete test with done
    //     done();
    // });

    // it("should allow errors to be thrown and caught when setting types on typeError", function (done) {
    //     // errored should move to true
    //     let errored = false;
    //     // root obj 
    //     const obj = {};
    //     // create a new instance...
    //     const writable = new Writable(obj, "", {
    //         typesafe: true
    //     });
    //     // perform setType on err value with a type which doesnt resolve to a typeCast method
    //     writable.get("err").setType("unknown", {
    //         error: (err) => {
    //             // expect the error matched
    //             chai.expect(err.toString()).to.equal("TypeError: err._type cannot be set to \"unknown\"");
    //             // mark error for outside (this will happen synchronously)
    //             errored = true;
    //         }
    //     });
    //     // expect error to be thrown
    //     chai.expect(errored).to.equal(true);

    //     // complete test with done
    //     done();
    // });

    // it("should allow errors to be thrown and caught when setting types if the typeCast method throws", function (done) {
    //     // errored should move to true
    //     let errored = false;
    //     // root obj 
    //     const obj = {};
    //     // create a new instance...
    //     const writable = new Writable(obj, "", {
    //         typesafe: true
    //     });
    //     // set type against "err" so that it throws if any write attempts are made against it
    //     writable.setType(() => {
    //         // throw error what ever the value is
    //         throw (new Error("error"));
    //     }, "err");
    //     // attempt to set on err var - (will emit an error)
    //     writable.set("err", "err", {
    //         error: (err) => {
    //             // expect the error matched
    //             chai.expect(err.toString()).to.equal("Error: error");
    //             // mark error for outside (this will happen synchronously)
    //             errored = true;
    //         }
    //     });
    //     // expect error to be thrown
    //     chai.expect(errored).to.equal(true);

    //     // complete test with done
    //     done();
    // });

    // it("should allow errors to be thrown and caught by parent writable instance when setting types on typeError", function (done) {
    //     // errored should move to true
    //     let errored = false;
    //     // root obj 
    //     const obj = {};
    //     // create a new instance...
    //     const writable = new Writable(obj, "", {
    //         typesafe: true,
    //         error: (err) => {
    //             // mark error for outside (this will happen synchronously)
    //             errored = true;
    //             // expect the error matched
    //             chai.expect(err.toString()).to.equal("TypeError: err._type cannot be set to \"unknown\"");
    //         }
    //     });
    //     // perform set 
    //     writable.get("err").setType("unknown");
    //     // expect error to be thrown
    //     chai.expect(errored).to.equal(true);

    //     // complete test with done
    //     done();
    // });

    // it("should allow errors to be thrown and to bubble to root when setting types on typeError", function (done) {
    //     // errored should move to true
    //     let errored = false;
    //     // root obj 
    //     const obj = {};
    //     // create a new instance...
    //     const writable = new Writable(new Writable(obj, "", {
    //         // typesafety is enforced from root
    //         typesafe: true,
    //         // as is the errorHandler
    //         error: (err) => {
    //             // mark error for outside (this will happen synchronously)
    //             errored = true;
    //             // expect the error matched
    //             chai.expect(err.toString()).to.equal("TypeError: err._type cannot be set to \"unknown\"");
    //         }
    //     }), "err");
    //     // perform set 
    //     writable.setType("unknown");
    //     // expect error to be thrown
    //     chai.expect(errored).to.equal(true);

    //     // complete test with done
    //     done();
    // });

    // it("should allow errors to be thrown and to bubble to root when setting types on typeError and to noop if no errorHandler is found", function (done) {
    //     // root obj 
    //     const obj = {};
    //     // create a new instance...
    //     const writable = new Writable(new Writable(obj, "", {
    //         // typesafety is enforced from root (but no error handler)
    //         typesafe: true
    //     }), "err");
    //     // perform set 
    //     writable.setType("unknown");

    //     // complete test with done
    //     done();
    // });

    // it("should allow errors to be thrown on typeError when setting values with \"typesafe\" == true", function (done) {
    //     // errored should move to true
    //     let errored = false;
    //     // root obj 
    //     const obj = {};
    //     // create a new instance...
    //     const writable = new Writable(obj, "", {
    //         typesafe: true
    //     });
    //     // perform set 
    //     writable.get("arr").setType("array");
    //     // set a number and coerce to string
    //     writable.get("arr").set(2, undefined, {
    //         error: (err) => {
    //             // mark error for outside (this will happen synchronously)
    //             errored = true;
    //             // expect the error matched
    //             chai.expect(err.toString()).to.equal("TypeError: arr cannot be set to 2");
    //         }
    //     });
    //     // expect error to be thrown
    //     chai.expect(errored).to.equal(true);
    //     // get the scope value from the instance
    //     chai.expect(writable.get("arr").raw(true)).to.equal(undefined);
    //     // set a number and coerce to string
    //     writable.get("arr").set(1, undefined, { typesafe: false });
    //     // get the scope value from the instance
    //     chai.expect(writable.get("arr").raw(true)).to.equal(1);

    //     // complete test with done
    //     done();
    // });

    // it("should allow type definitions to be set on the Writable instance to cover multiple positions", function (done) {
    //     // root obj 
    //     const obj = [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }];
    //     // create a new instance...
    //     const writable = new Writable(false, "a", { typesafe: true });
    //     // set obj into writable?
    //     writable.set(obj, undefined, { replaceRoot: true });
    //     // apply types
    //     const type = writable.get("*.b.*.c.*.d").setType("number");
    //     // set a number and coerce to string
    //     writable.get("1.b.0.c.0.d").set("2");
    //     // get the scope value from the instance
    //     chai.expect(writable.get("1.b.0.c.0.d").raw(true)).to.equal(2);
    //     // set a number and coerce to string
    //     writable.get("1.b.1.c.0.d").set("2");
    //     // get the scope value from the instance
    //     chai.expect(writable.get("1.b.1.c.0.d").raw(true)).to.equal(2);
    //     // set a number and coerce to string
    //     writable.get("1.b.0.c.0.d").set("1", undefined, { typesafe: false });
    //     // get the scope value from the instance
    //     chai.expect(writable.get("1.b.0.c.0.d").raw(true)).to.equal("1");
    //     // drop the type
    //     type.delete();
    //     // set a number and coerce to string
    //     writable.get("1.b.1.c.0.d").set("2");
    //     // get the scope value from the instance
    //     chai.expect(writable.get("1.b.1.c.0.d").raw(true)).to.equal("2");
    //     // apply types
    //     writable.get("**.d").setType("number");
    //     // set a number and coerce to string
    //     writable.get("1.b.1.c.0.d").set("2");
    //     // get the scope value from the instance
    //     chai.expect(writable.get("1.b.1.c.0.d").raw(true)).to.equal(2);

    //     // complete test with done
    //     done();
    // });

    it("should allow set operations on the Writable instance via transactions", function (done) {
        // alter the obj
        const obj = { a: { b: 1 } };
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // initiate a transaction
        const operation = writable.transaction(function () {
            // example of an operation inside transaction
            this.get("a").set({ c: 2 }, undefined, { merge: true });
        });
        // check that the value was altered
        chai.expect(obj).to.eql({ a: { b: 1, c: 2 } });
        // revert the operation
        operation.undo();
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.eql({ a: { b: 1 } });
        // allow the operation to be cancelled
        writable.transaction(function (cancel) {
            // transactions operations
            this.get("a").set(3);
            // cancel
            cancel();
        });
        // if we didnt cancel a would equal 3
        // chai.expect(writable.raw(true)).to.eql({a:3});
        // check the value is equal to the value we supplied
        chai.expect(writable.raw(true)).to.eql({ a: { b: 1 } });
        // allow the operation to be cancelled
        writable.get("a").transaction(function () {
            // transactions operations
            this.set(2);
        }, "b");
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.eql({ a: { b: 2 } });
        // allow the operation to be cancelled
        writable.transaction(function () {
            // transactions operations
            this.set(2, "b");
        }, "", {
            fullKey: true,
            merge: true
        });
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.eql({ a: { b: 2 }, b: 2 });
        // allow the operation to be cancelled
        writable.transaction(function () {
            // transactions operations  
            this.set(3);
        }, "~a.b");
        // get the scope value from the instance
        chai.expect(writable.raw(true)).to.eql({ a: { b: 3 }, b: 2 });

        // complete test with done
        done();
    });

    it("should allow set operations on the Writable instance via transaction Promise", function (done) {
        // alter the obj
        const obj = { a: { b: 1 } };
        // create a new instance...
        const writable = new Writable(obj, "", {});
        // initiate a transaction
        const operation = writable.transaction(function () {

            // return a promise
            return new Promise((resolve) => {
                // example of an operation inside transaction
                this.get("a").set({ c: 2 }, undefined, { merge: true });
                // resolve the promise
                resolve();
            });
        });
        // transactions which resolve to a promise return a promise...
        operation.then((state) => {
            // check that the value was altered
            chai.expect(obj).to.eql({ a: { b: 1, c: 2 } });
            // revert the operation
            state.undo();
            // get the scope value from the instance
            chai.expect(writable.raw(true)).to.eql({ a: { b: 1 } });
           
            // complete test with done
            done();
        });
    });

    it("should catch errors thrown via transaction Promise", function (done) {
        // check that the error was thrown successfully
        let errored = false;
        // alter the obj
        const obj = { a: { b: 1 } };
        // create a new instance...
        const writable = new Writable(obj);
        // initiate a transaction which returns a promise which rejects
        const operation = writable.transaction(function () {

            // return a promise which rejects -- transaction will return result of this promise
            return new Promise((...[,reject]) => {
                // example of an operation inside transaction
                this.get("a").set({ c: 2 }, undefined, { merge: true });
                // resolve the promise
                reject(new Error("not accepting"));
            });
        }, {
            error: (err) => {
                chai.expect(err.toString()).to.equal("Error: not accepting");
                // mark error happened
                errored = true;
            }
        });
        // obj will not have been altered
        operation.then(() => {
            // ensure the transaction was cancelled
            chai.expect(obj).to.eql({ a: { b: 1 } });
            // expect error to have bubbled to handler
            chai.expect(errored).to.equal(true);

            // complete test with done
            done();
        });
    });

    it("should catch errors thrown via transaction Promise to the Adapter", function (done) {
        // check that the error was thrown successfully
        let errored = false;
        // alter the obj
        const obj = { a: { b: 1 } };
        // create a new instance...
        const writable = new Writable(obj);
        // initiate a transaction which returns a promise which rejects
        const operation = writable.get("", {
            adapters: [{
                register: () => {},
                error: (err) => {
                    // error handler as adapter
                    chai.expect(err.toString()).to.equal("Error: not accepting");
                    // mark error happened
                    errored = true;
                }
            }]
        }).transaction(function () {

            // return a promise which rejects -- transaction will return result of this promise
            return new Promise((...[,reject]) => {
                // example of an operation inside transaction
                this.get("a").set({ c: 2 }, undefined, { merge: true });
                // resolve the promise
                reject(new Error("not accepting"));
            });
        });
        // obj will not have been altered
        operation.then(() => {
            // ensure the transaction was cancelled
            chai.expect(obj).to.eql({ a: { b: 1 } });
            // expect error to have bubbled to handler
            chai.expect(errored).to.equal(true);

            // complete test with done
            done();
        });
    });

});
