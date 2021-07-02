// import chai for testing
import chai from 'chai';

// test subject (set a value at a dot deliminated key position within an Object or an Array (*note that this operation is mutable))
import { setValueAt } from "../../src/internal/utility/setValueAt.js";

// set-up spec testing feature-set
describe("setValueAt ~ from ~ freo/utility", function () {

    it("should set value given !object, no key and the new value - primitives at root are always immutable", function (done) {
        // initial object
        const obj = "test";
        // create an immutable clone
        const response = setValueAt(obj, undefined, 2);
        // check primitives match when equal
        chai.expect(response).to.equal(2);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal(`"test"`);
        // expect the response to be as set
        chai.expect(JSON.stringify(response)).to.equal("2");

        // complete test with done
        done();
    });

    it("should set value given object, key and value with immutability", function (done) {
        // initial object
        const obj = { a: 1 };
        // create an immutable clone
        const response1 = setValueAt(obj, "a", 2, { immutable: true });
        // check primitives match when equal
        chai.expect(response1.a).to.equal(2);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response1)).to.equal("{\"a\":2}");
        // replace with alt at root
        const response2 = setValueAt(response1, "", { b: 1 }, { immutable: true });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response2)).to.equal("{\"b\":1}");
        // replace with alt at root
        const response3 = setValueAt(obj, "", {}, { immutable: true });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect all props to have been cleared
        chai.expect(JSON.stringify(response3)).to.equal("{}");

        // complete test with done
        done();
    });

    it("should set value given object, key and value with mutablitly", function (done) {
        // initial object
        let obj = { a: 1 };
        // create an immutable clone
        const response1 = setValueAt(obj, "a", 2);
        // check primitives match when equal
        chai.expect(response1.a).to.equal(2);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":2}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response1)).to.equal("{\"a\":2}");
        // replace with alt at root
        const response2 = setValueAt(response1, "", { b: 1 });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"b\":1}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response2)).to.equal("{\"b\":1}");
        // replace with alt at root
        const response3 = setValueAt(obj, "", {});
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{}");
        // expect all props to have been cleared
        chai.expect(JSON.stringify(response3)).to.equal("{}");
        // replace with alt at root (restart the obj again)
        const response4 = setValueAt((obj = {a:1}), "", null);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{}");
        // expect all props to have been cleared
        chai.expect(JSON.stringify(response4)).to.equal("null");

        // complete test with done
        done();
    });

    it("should set values in position using immutable merge without altering source targets type (starting from obj)", function (done) {
        // initial object
        const obj = { a: { b: { c: { d: 1 } } } }, dropped = {"a.b.c.0": 2};
        // set the value at key which uses [] index pointers -- * note that creationMaxDepth is 2 because we're setting from "0"
        const response1 = setValueAt(obj, "a.b.c.0.d", 1, { immutable: true, merge: true, creationMaxDepth: 2, dropped: dropped });
        // check the value was set into position
        chai.expect(response1.a.b.c[0].d).to.equal(1);
        // check original values persist
        chai.expect(response1.a.b.c.d).to.equal(1);
        // ensure we didnt drop any keys
        chai.expect(dropped).to.eql({
            // if values are already present on dropped they wont be set again
            "a.b.c.0": 2,
            "a.b.c.0.d": undefined
        });

        // complete test with done
        done();
    });

    it("should set values in position using mutable merge without altering source targets type (starting from obj)", function (done) {
        // initial object
        const obj = { a: { b: { c: [{d: 1}] } } }, dropped = {};;
        // set the value at key which uses [] index pointers -- * note that creationMaxDepth is 2 because we're setting from "0"
        const response1 = setValueAt(obj, "a.b.c.d", 1, { merge: true, creationMaxDepth: 2, dropped: dropped });
        // check the value was set into position
        chai.expect(response1.a.b.c.d).to.equal(1);
        // check original values persist
        chai.expect(response1.a.b.c[0].d).to.equal(1);
        // ensure we didnt drop any keys
        chai.expect(dropped).to.eql({
            "a.b.c.d": undefined
        });

        // complete test with done
        done();
    });

    it("should set values in position using immutable merge without altering source targets type (starting from array)", function (done) {
        // initial object
        const obj = { a: { b: { c: [{d: 1}] } } };
        // set the value at key which uses [] index pointers -- * note that creationMaxDepth is 2 because we're setting from "0"
        const response1 = setValueAt(obj, "a.b.c.d", 1, { immutable: true, merge: true, creationMaxDepth: 2 });
        // check the value was set into position
        chai.expect(response1.a.b.c.d).to.equal(1);
        // check original values persist
        chai.expect(response1.a.b.c[0].d).to.equal(1);

        // complete test with done
        done();
    });

    it("should set values in position using mutable merge without altering source targets type (starting from array)", function (done) {
        // initial object
        const obj = { a: { b: { c: { d: 1 } } } };
        // set the value at key which uses [] index pointers -- * note that creationMaxDepth is 2 because we're setting from "0"
        const response1 = setValueAt(obj, "a.b.c.0.d", 1, { merge: true, creationMaxDepth: 2 });
        // check the value was set into position
        chai.expect(response1.a.b.c[0].d).to.equal(1);
        // check original values persist
        chai.expect(response1.a.b.c.d).to.equal(1);

        // complete test with done
        done();
    });

    it("should set values in position altering immutable source targets type if path doesnt fit", function (done) {
        // initial object
        const obj = { a: { b: { c: { d: 1 } } } };
        // set the value at key which uses [] index pointers -- * note that creationMaxDepth is 3 because we're setting from "c"
        const response1 = setValueAt(obj, "a.b.c.0.d", 1, { immutable: true, creationMaxDepth: 3 });
        // check the value was set into position
        chai.expect(response1.a.b.c[0].d).to.equal(1);
        // check original values persist
        chai.expect(response1.a.b.c.d).to.equal(undefined);

        // complete test with done
        done();
    });

    it("should set values in position altering mutable source targets type if path doesnt fit", function (done) {
        // initial object
        const obj = { a: { b: { c: { d: 1 } } } };
        // set the value at key which uses [] index pointers -- * note that creationMaxDepth is 3 because we're setting from "c"
        const response1 = setValueAt(obj, "a.b.c.0.d", 1, { creationMaxDepth: 3 });
        // check the value was set into position
        chai.expect(response1.a.b.c[0].d).to.equal(1);
        // check original values persist
        chai.expect(response1.a.b.c.d).to.equal(undefined);

        // complete test with done
        done();
    });

    it("should set value given object, key and value with immutability and no creationMaxDepth", function (done) {
        // initial object
        const obj = { a: 1 };
        // create an immutable clone
        const response1 = setValueAt(obj, "a", 2, { immutable: true, creationMaxDepth: 0 });
        // check primitives match when equal
        chai.expect(response1.a).to.equal(2);
        // create an immutable clone
        const response2 = setValueAt(response1, "b", 2, { immutable: true, creationMaxDepth: 0 });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response2)).to.equal("{\"a\":2}");

        // complete test with done
        done();
    });

    it("should set value given object, key and value with mutability and no creationMaxDepth", function (done) {
        // initial object
        const obj = { a: 1 };
        // create an immutable clone
        const response1 = setValueAt(obj, "a", 2, { creationMaxDepth: 0 });
        // check primitives match when equal
        chai.expect(response1.a).to.equal(2);
        // create an immutable clone
        const response2 = setValueAt(response1, "b", 2, { immutable: true, creationMaxDepth: 0 });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":2}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response2)).to.equal("{\"a\":2}");

        // complete test with done
        done();
    });

    it("should set value given object, key and value with immutability", function (done) {
        // initial object
        const obj = { a: { b: 1 } }, dropped = {};
        // create an immutable clone
        const response = setValueAt(obj, "a.0", 1, { immutable: true, creationMaxDepth: -1, dropped: dropped });
        // check primitives match when equal
        chai.expect(response.a[0]).to.equal(1);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":{\"b\":1}}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response)).to.equal("{\"a\":[1]}");
        // expect the response to be as set
        chai.expect(JSON.stringify(dropped)).to.equal("{\"a\":{\"b\":1}}");
        // complete test with done
        done();
    });

    it("should set value given object, key and value with immutability", function (done) {
        // initial object
        const obj = { a: [1] }, dropped = {};
        // create an immutable clone
        const response = setValueAt(obj, "a.b", 1, { immutable: true, creationMaxDepth: -1, dropped: dropped });
        // check primitives match when equal
        chai.expect(response.a.b).to.equal(1);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":[1]}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response)).to.equal("{\"a\":{\"b\":1}}");
        // expect the response to be as set
        chai.expect(JSON.stringify(dropped)).to.equal("{\"a\":[1]}");

        // complete test with done
        done();
    });

    it("should set value given !object at a nested key position with a creationMaxDepth which allows the coversion - immutable", function (done) {
        // initial object
        const obj = { a: "test" }, b = { a: { a: 1 }, c: { b: 1 } }, c = { a: 1 };
        // create an immutable clone (maxDepth of 2 to cover a: and a.b)
        const response = setValueAt(obj, "a.b", b, { immutable: true, creationMaxDepth: 2 });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal(`{"a":"test"}`);
        // expect the response to be as set
        chai.expect(JSON.stringify(response)).to.equal(`{"a":{"b":{"a":{"a":1},"c":{"b":1}}}}`);
        // reference the a value
        const testA = response.a;
        // reference the a->b value
        const testAB = response.a.b;
        // reference the a->b->a value
        const testABA = response.a.b.a;
        // create an immutable clone (maxDepth of 2 to cover a: and a.b)
        const response2 = setValueAt(response, "a", { b: { c: c } }, { immutable: true, creationMaxDepth: 2, merge: true });
        // expect given to be the same
        chai.expect(JSON.stringify(response)).to.equal(`{"a":{"b":{"a":{"a":1},"c":{"b":1}}}}`);
        // expect the response to be as set
        chai.expect(JSON.stringify(response2)).to.equal(`{"a":{"b":{"a":{"a":1},"c":{"b":1,"a":1}}}}`);
        // ensure this reference is has changed because the value is different
        chai.expect(testA).to.not.equal(response2.a);
        // ensure the reference is equal because this branch was unaltered
        chai.expect(testAB).to.not.equal(response2.a.b);
        // ensure the reference is equal because this branch was unaltered
        chai.expect(testABA).to.equal(response2.a.b.a);

        // complete test with done
        done();
    });

    it("should set value given !object at a nested key position with a creationMaxDepth which allows the coversion - mutable", function (done) {
        // initial object
        const obj = { a: "test" }, b = { a: 1, c: { b: 1 } }, c = { a: 1 };
        // create an immutable clone (maxDepth of 2 to cover a: and a.b)
        const response = setValueAt(obj, "a.b", b, { creationMaxDepth: 2 });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal(`{"a":{"b":{"a":1,"c":{"b":1}}}}`);
        // expect the response to be as set
        chai.expect(JSON.stringify(response)).to.equal(`{"a":{"b":{"a":1,"c":{"b":1}}}}`);
        // reference the a value
        const testA = response.a;
        // reference the a->b value
        const testAB = response.a.b;
        // reference the a->b->a value
        const testABA = response.a.b.a;
        // create an immutable clone (maxDepth of 2 to cover a: and a.b)
        const response2 = setValueAt(response, "a", { b: { c: c } }, { creationMaxDepth: 2, merge: true });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal(`{"a":{"b":{"a":1,"c":{"b":1,"a":1}}}}`);
        // expect the response to be as set
        chai.expect(JSON.stringify(response2)).to.equal(`{"a":{"b":{"a":1,"c":{"b":1,"a":1}}}}`);
        // ensure the reference is equal
        chai.expect(testA).to.equal(response2.a);
        // ensure the reference is equal
        chai.expect(testAB).to.equal(response2.a.b);
        // ensure the reference is equal because this branch was unaltered
        chai.expect(testABA).to.equal(response2.a.b.a);

        // complete test with done
        done();
    });

    it("should set nested property value given object, key, value and creationMaxDepth with immutability", function (done) {
        // initial object
        const obj = { a: 1 }, written = {}, dropped = {};
        // expect nested properties can be constructed in single pass (using createNAbsentees)
        const response = setValueAt(obj, "b.c[0].d", 1, {
            immutable: true,
            creationMaxDepth: 4,
            written: written,
            dropped: dropped
        });
        // expect the object to be immutably updated with nested properties
        chai.expect(response).to.eql({
            a: 1,
            b: {
                c: [
                    {
                        d: 1
                    }
                ]
            }
        });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect the missing positions to be filled with data type
        chai.expect(JSON.stringify(response)).to.equal("{\"a\":1,\"b\":{\"c\":[{\"d\":1}]}}");
        // expect the written to have been filled
        chai.expect(written).to.eql({
            "b.c.0.d": 1
        });
        // expect the written to have been filled
        chai.expect(dropped).to.eql({
            "b": undefined,
            "b.c": undefined,
            "b.c.0": undefined,
            "b.c.0.d": undefined
        });

        done();
    });

    it("should set nested property value given object, key, value and creationMaxDepth with immutability collecting mutliple operations onto a shared \"dropped\" array", function (done) {
        // initial object
        const obj = { a: 1 }, dropped = [];
        // expect nested properties can be constructed in single pass (using createNAbsentees)
        const response1 = setValueAt(obj, "b.c[0].d", 1, {
            immutable: true,
            creationMaxDepth: 4,
            dropped: dropped
        });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect the object to be immutably updated with nested properties
        chai.expect(JSON.stringify(response1)).to.equal("{\"a\":1,\"b\":{\"c\":[{\"d\":1}]}}");
        // expect the dropped to have been filled
        chai.expect(dropped).to.eql([{
            "b": undefined,
            "b.c": undefined,
            "b.c.0": undefined,
            "b.c.0.d": undefined
        }]);
        // expect nested properties can be constructed in single pass (using createNAbsentees)
        const response2 = setValueAt(response1, "b.c[0].d", 2, {
            immutable: true,
            creationMaxDepth: 4,
            dropped: dropped
        });
        // expect the object to be immutably updated with nested properties
        chai.expect(JSON.stringify(response2)).to.equal("{\"a\":1,\"b\":{\"c\":[{\"d\":2}]}}");
        // expect dropped to record each operation as its handed in to a seperate object in the provided array
        chai.expect(dropped).to.eql([{
            "b": undefined,
            "b.c": undefined,
            "b.c.0": undefined,
            "b.c.0.d": undefined
        }, {
            "b.c.0.d": 1
        }]);

        done();
    });

    it("should set nested property value given object, key, value and creationMaxDepth with mutability", function (done) {
        // initial object
        const obj = { a: 1 };
        // expect nested properties can be constructed in single pass (using createNAbsentees)
        const response = setValueAt(obj, "b.c[0].d", 1, {
            creationMaxDepth: 4
        });
        // expect the object to be immutably updated with nested properties
        chai.expect(response).to.eql({
            a: 1,
            b: {
                c: [
                    {
                        d: 1
                    }
                ]
            }
        });
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1,\"b\":{\"c\":[{\"d\":1}]}}");
        // expect the missing positions to be filled with data type
        chai.expect(JSON.stringify(response)).to.equal("{\"a\":1,\"b\":{\"c\":[{\"d\":1}]}}");

        done();
    });

    it("should immutably set values given object and key that points to items in arrays (without scoping the item) setting values on matching items", function (done) {
        // check that each was checked for type
        let typeChecked = 0;
        // get this key
        const key = "a.*.b.*.c.*.d";
        // object to insert
        const insert = { e: { b: 1 }};
        // from this object
        const obj = { a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // insert the insert object into all locations
        const response = setValueAt(obj, key, insert, {
            immutable: true,
            typesafe: true,
            types: {
                "**": {
                    "d": {
                        "_type": {
                            "fn": (v) => {
                                typeChecked++;
                                
                                return v;
                            }
                        }
                    }
                }
            }
        });
        // expect it to match this when stringified
        const expectation = `{"a":[{},{"b":[{"c":[{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}}]},{"c":[{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}}]}]}]}`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response.a[1].b[0].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[0].c[1].d).to.eql(insert);
        chai.expect(response.a[1].b[0].c[2].d).to.eql(insert);
        chai.expect(response.a[1].b[1].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[1].c[1].d).to.eql(insert);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.not.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect each was attempted for typecheck
        chai.expect(typeChecked).to.equal(5);
        // expect the two objects to not be equal by ref
        chai.expect(response).to.not.equal(obj);
        // complete test with done
        done();
    });

    it("should immutably set values given object and key that points to items using wildcard and an options definition", function (done) {
        // get this key
        const key = "a.*.b.0|1.c.0.d";
        // object to insert
        const insert = {e: { b: 1 }};
        // from this object
        const obj = { a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // insert the insert object into all locations
        const response = setValueAt(obj, key, insert, {
            immutable: true
        });
        // expect it to match this when stringified
        const expectation = `{"a":[{},{"b":[{"c":[{"d":{"e":{"b":1}}},{"d":2},{"d":3}]},{"c":[{"d":{"e":{"b":1}}},{"d":5}]}]}]}`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response.a[1].b[0].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[0].c[1].d).to.eql(2);
        chai.expect(response.a[1].b[0].c[2].d).to.eql(3);
        chai.expect(response.a[1].b[1].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[1].c[1].d).to.eql(5);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.not.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect the two objects to not be equal by ref
        chai.expect(response).to.not.equal(obj);
        // complete test with done
        done();
    });

    it("should mutably set values given object and key that points to items using wildcard and an options definition", function (done) {
        // get this key
        const key = "a.*.b.0|1.c.0.d";
        // object to insert
        const insert = {e: { b: 1 }};
        // from this object
        const obj = { a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // insert the insert object into all locations
        const response = setValueAt(obj, key, insert, {});
        // expect it to match this when stringified
        const expectation = `{"a":[{},{"b":[{"c":[{"d":{"e":{"b":1}}},{"d":2},{"d":3}]},{"c":[{"d":{"e":{"b":1}}},{"d":5}]}]}]}`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response.a[1].b[0].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[0].c[1].d).to.eql(2);
        chai.expect(response.a[1].b[0].c[2].d).to.eql(3);
        chai.expect(response.a[1].b[1].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[1].c[1].d).to.eql(5);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect the two objects to not be equal by ref
        chai.expect(response).to.equal(obj);
        // complete test with done
        done();
    });

    it("should immutably set values given object and key that points to items using an options definition at root", function (done) {
        // get this key
        const key = "a|b";
        // object to insert
        const insert = "test";
        // from this object
        const obj = { a: 1, b: 2, c: 3 };
        // insert the insert object into all locations
        const response = setValueAt(obj, key, insert, {
            immutable: true,
            creationMaxDepth: 1,
        });
        // expect it to match this when stringified
        const expectation = `{"a":"test","b":"test","c":3}`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response.a).to.eql(insert);
        chai.expect(response.b).to.eql(insert);
        chai.expect(response.c).to.eql(3);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.not.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect the two objects to not be equal by ref
        chai.expect(response).to.not.equal(obj);
        // complete test with done
        done();
    });

    it("should mutably set values given object and key that points to items using an options definition at root", function (done) {
        // get this key
        const key = "a|b";
        // object to insert
        const insert = "test";
        // from this object
        const obj = { a: 1, b: 2, c: 3 };
        // insert the insert object into all locations
        const response = setValueAt(obj, key, insert, {
            creationMaxDepth: 1,
        });
        // expect it to match this when stringified
        const expectation = `{"a":"test","b":"test","c":3}`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response.a).to.eql(insert);
        chai.expect(response.b).to.eql(insert);
        chai.expect(response.c).to.eql(3);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect the two objects to not be equal by ref
        chai.expect(response).to.equal(obj);
        // complete test with done
        done();
    });

    it("should immutably set values given object and key that points to items in objects (without scoping the item) setting values on matching items", function (done) {
        // get this key
        const key = "a.**.d";
        // object to insert
        const insert = {e: { b: 1 }};
        // from this object
        const obj = {
            a: {
                0: {},
                1: {
                    b: {
                        0: {
                            c: {
                                0: { d: 1 },
                                1: { d: 2 },
                                2: { d: 3 }
                            }
                        },
                        1: {
                            c: {
                                0: { d: 4 },
                                1: { d: 5 }
                            }
                        }
                    }
                }
            }
        };
        // insert the insert object into all locations
        const response = setValueAt(obj, key, insert, {
            immutable: true
        });
        // expect it to match this when stringified
        const expectation = `{"a":{"0":{},"1":{"b":{"0":{"c":{"0":{"d":{"e":{"b":1}}},"1":{"d":{"e":{"b":1}}},"2":{"d":{"e":{"b":1}}}}},"1":{"c":{"0":{"d":{"e":{"b":1}}},"1":{"d":{"e":{"b":1}}}}}}}}}`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response.a[1].b[0].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[0].c[1].d).to.eql(insert);
        chai.expect(response.a[1].b[0].c[2].d).to.eql(insert);
        chai.expect(response.a[1].b[1].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[1].c[1].d).to.eql(insert);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.not.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect the two objects to not be equal by ref
        chai.expect(response).to.not.equal(obj);
        // complete test with done
        done();
    });

    it("should mutably set values given object and key that points to items in arrays (without scoping the item) setting values on matching items", function (done) {
        // get this key (* marks wildcard at a single level -- matching keys must be 8 segments deep)
        const key = "a.*.b.*.*.*.d";
        // object to insert
        const insert = {e: { b: 1 }};
        // from this object
        const obj = { a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // insert the insert object into all locations (that fit creationMaxDepth - allows creation/writing of 2 keys)
        const response = setValueAt(obj, key, insert, {
            creationMaxDepth: 2,
        });
        // expect it to match this when stringified
        const expectation = `{"a":[{},{"b":[{"c":[{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}}]},{"c":[{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}}]}]}]}`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response.a[1].b[0].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[0].c[1].d).to.eql(insert);
        chai.expect(response.a[1].b[0].c[2].d).to.eql(insert);
        chai.expect(response.a[1].b[1].c[0].d).to.eql(insert);
        chai.expect(response.a[1].b[1].c[1].d).to.eql(insert);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect the two objects to not be equal by ref
        chai.expect(response).to.equal(obj);
        // complete test with done
        done();
    });

    it("should immutably set values given object and key that points to items in arrays (without scoping the item) setting values on matching items where root is an Array", function (done) {
        // get this key
        const key = "*.a.*.b.*.c.*.d";
        // object to insert
        const insert = {e: { b: 1 }};
        // from this object
        const obj = [{ a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] }];
        // insert the insert object into all locations
        const response = setValueAt(obj, key, insert, {
            immutable: true
        });
        // expect it to match this when stringified
        const expectation = `[{"a":[{},{"b":[{"c":[{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}}]},{"c":[{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}}]}]}]}]`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response[0].a[1].b[0].c[0].d).to.eql(insert);
        chai.expect(response[0].a[1].b[0].c[1].d).to.eql(insert);
        chai.expect(response[0].a[1].b[0].c[2].d).to.eql(insert);
        chai.expect(response[0].a[1].b[1].c[0].d).to.eql(insert);
        chai.expect(response[0].a[1].b[1].c[1].d).to.eql(insert);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.not.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect the two objects to be equal by ref
        chai.expect(response).to.not.equal(obj);

        // complete test with done
        done();
    });

    it("should mutably set values given object and key that points to items in arrays (without scoping the item) setting values on matching items where root is an Array", function (done) {
        // get this key - mark each node the we accessed into accessed
        const key = "*.a.*.b.*.c.*.d";
        // object to insert
        const insert = {e: { b: 1 }};
        // from this object
        const obj = [{ a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] }];
        // insert the insert object into all locations
        const response = setValueAt(obj, key, insert, {
        });
        // expect it to match this when stringified
        const expectation = `[{"a":[{},{"b":[{"c":[{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}}]},{"c":[{"d":{"e":{"b":1}}},{"d":{"e":{"b":1}}}]}]}]}]`;
        // expect all inserted values to hold ref to same insert obj
        chai.expect(response[0].a[1].b[0].c[0].d).to.eql(insert);
        chai.expect(response[0].a[1].b[0].c[1].d).to.eql(insert);
        chai.expect(response[0].a[1].b[0].c[2].d).to.eql(insert);
        chai.expect(response[0].a[1].b[1].c[0].d).to.eql(insert);
        chai.expect(response[0].a[1].b[1].c[1].d).to.eql(insert);
        // expect value to be updated
        chai.expect(JSON.stringify(obj)).to.equal(expectation);
        chai.expect(JSON.stringify(response)).to.equal(expectation);
        // expect the two objects to be equal by ref
        chai.expect(response).to.equal(obj);

        // complete test with done
        done();
    });

    it("should typeCast values and throw errors through error handler on TypeError (when typeCasting returns undefined)", function (done) {
        // initial object
        const obj = { a: 1 };
        // construct types to lock the a value to a number
        const types = {
            "a": {
                _type: {
                    weight: 1,
                    fn: (v) => {

                        return (!isNaN(v) ? parseInt(v) : undefined);
                    }
                }
            }
        };
        // attempt to set the value into the typeCasted var (will be accepted because we're passing an int)
        const response1 = setValueAt(obj, "a", 2, {
            // keep obj unchanged
            immutable: true,
            // mark as typesafe
            typesafe: true,
            // flat object of associated types
            types: types,
            // error handler to absorb type casting errors (shouldnt be called)
            error: (err) => done(err)
        });
        // check primitives match when equal
        chai.expect(response1.a).to.equal(2);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response1)).to.equal("{\"a\":2}");
        // attempt to set the value into the typeCasted var (will be accepted because we're passing a number in a string)
        const response2 = setValueAt(obj, "a", "2", {
            // keep obj unchanged
            immutable: true,
            // mark as typesafe
            typesafe: true,
            // flat object of associated types
            types: types,
            // error handler to absorb type casting errors (shouldnt be called)
            error: (err) => done(err)
        });
        // check primitives match when equal
        chai.expect(response2.a).to.equal(2);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect the response to be as set
        chai.expect(JSON.stringify(response2)).to.equal("{\"a\":2}");
        // response3 will throw an error when attempt to set the value as a string
        let errored = false;
        // attempt to set the value into the typeCasted var (wont be accepted because we're passing in a string)
        const response3 = setValueAt(obj, "a", "string", {
            // keep obj unchanged
            immutable: true,
            // mark as typesafe
            typesafe: true,
            // flat object of associated types
            types: types,
            // error handler to absorb type casting errors
            error: (err) => {
                // mark error for outside
                errored = true;
                // check the typeError was thrown correctly
                chai.expect(err.toString()).to.equal("TypeError: a cannot be set to \"string\"");
            }
        });
        // synchronous set errored
        chai.expect(errored).to.equal(true);
        // check primitives match when equal
        chai.expect(response3.a).to.equal(undefined);
        // expect given to be the same
        chai.expect(JSON.stringify(obj)).to.equal("{\"a\":1}");
        // expect the response to be undefined after failed typeError
        chai.expect(response3).to.eql({ "a": undefined });

        // complete test with done
        done();
    });

    it("should allow typeCast methods to throw their own error from the casting method itself", function(done) {
        // expect errored to be mutated by error handler when error is thrown and matches expectation
        let errored = false;
        // initial object
        const obj = { a: 1 };
        // construct types to lock the a value to a number
        const types = {
            "err": {
                _type: {
                    weight: 1,
                    fn: () => {
                        // throw error regardless of value
                        throw(new Error("error"));
                    }
                }
            }
        };
        // attempt to set the value into the typeCasted var (no error handler - error will be nooped)
        const response1 = setValueAt(obj, "err", 2, {
            // keep obj unchanged
            immutable: true,
            // mark as typesafe
            typesafe: true,
            // flat object of associated types
            types: types
        });
        // check primitives match when equal
        chai.expect(response1.err).to.equal(undefined);
        // attempt to set the value into the typeCasted var (error will be caught by handler)
        const response2 = setValueAt(obj, "err", 2, {
            // keep obj unchanged
            immutable: true,
            // mark as typesafe
            typesafe: true,
            // flat object of associated types
            types: types,
            // error handler to ensure the correct error is passed in
            error: (err) => {
                // expect the error matched
                chai.expect(err.toString()).to.equal("Error: error");
                // mark the error
                errored = true;
            }
        });
        // check primitives match when equal
        chai.expect(response2.err).to.equal(undefined);
        // expect the error to have been thrown instead of the default
        chai.expect(errored).to.equal(true);

        done()
    });

    it("should typeCast values against the root level", function (done) {
        // initial object
        let obj = 1;
        // access key (to access root node)
        const key = "";
        // casting to force the number
        const castInteger = (v) => {

            return (!isNaN(v) ? parseInt(v) : undefined);
        };
        // use setValueAt to set types
        const response1 = setValueAt((obj = 1), key, "2", {
            // mark as typesafe
            typesafe: true,
            // feed a root level type definition
            types: {
                _type: {
                    fn: castInteger
                }
            }
        });
        // expect type casting to have taken hold
        chai.expect(response1).to.equal(2);
        // use setValueAt to set types
        const response2 = setValueAt((obj = {}), key, {a:"2"}, {
            // mark as typesafe
            typesafe: true,
            // feed a root level type definition
            types: {
                a: {
                    _type: {
                        fn: castInteger
                    }
                }
            }
        });
        // expect type casting to have taken hold
        chai.expect(response2.a).to.equal(2);

        done();
    });

    it("should allow typeCast object to be built against a typeCast itself and reject with appropriate errors", function (done) {
        // initial object
        let types = {}, errored = false;
        // casting to force the number
        const castInteger = (v) => {

            return (!isNaN(v) ? parseInt(v) : undefined);
        };
        // use setValueAt to set types
        types = setValueAt(types, "a", {
            _type: {
                fn: castInteger
            }
        }, {
            // mark as typesafe
            typesafe: true,
            // mark that we're setting a type (this instructs internals to report errors correctly)
            asDefinition: true,
            // setting the _type definition at prop
            definition: "_type",
            // feed a root level type definition to typeCast an obj of types
            types: {
                _type: {
                    fn: (type) => (type && type._type && typeof type._type.fn == "function" ? type : undefined)
                }
            }
        });
        // expect type casting to have taken hold
        chai.expect(types).to.eql({
            a: {
                _type: {
                    fn: castInteger
                }
            }
        });
        // use setValueAt to set types
        types = setValueAt(types, "a", {
            _type: {
                fn: "error"
            }
        }, {
            // mark as typesafe
            typesafe: true,
            // mark that we're setting a type (this instructs internals to report errors correctly)
            asDefinition: true,
            // setting the _type definition at prop
            definition: "_type",
            // catch errors from attempting to set a type
            error: (err) => {
                // ensure err was emitted correctly
                chai.expect(err.toString()).to.equal("TypeError: a._type cannot be set to \"error\"")
                // mark that we errored
                errored = true;
            },
            // feed a root level type definition
            types: {
                _type: {
                    fn: (type) => (type && type._type && typeof type._type.fn == "function" ? type : undefined)
                }
            }
        });
        // expect the error to have been hit
        chai.expect(errored).to.equal(true);
        // reset errored and test with skipMessage
        errored = false;
        // use setValueAt to set types
        types = setValueAt(types, "a", {
            _type: {
                fn: "error"
            }
        }, {
            // mark as typesafe
            typesafe: true,
            // mark that we're setting a type (this instructs internals to report errors correctly)
            asDefinition: true,
            // setting the _type definition at prop
            definition: "_type",
            // skipp the message should stop errors being sent
            skipMessage: {src: "test"},
            // catch errors from attempting to set a type
            error: (err) => {
                // ensure err was emitted correctly
                chai.expect(err.toString()).to.equal("TypeError: a._type cannot be set to \"error\"")
                // mark that we errored
                errored = true;
            },
            // feed a root level type definition
            types: {
                _type: {
                    fn: (type) => (type && type._type && typeof type._type.fn == "function" ? type : undefined)
                }
            }
        });
        // expect the error to have been hit
        chai.expect(errored).to.equal(true);

        done();
    });

    it("should allow typeCast object to be built using options and wildcards", function (done) {
        // initial object
        let types = {};
        // casting to force the number
        const castInteger = (v) => {

            return (!isNaN(v) ? parseInt(v) : undefined);
        };
        // use setValueAt to set types
        types = setValueAt(types, "a.b.c|d", {
            _type: {
                fn: castInteger
            }
        }, {
            // no depth rules
            creationMaxDepth: -1,
            // mark as typesafe
            typesafe: true,
            // mark that we're setting a type (this instructs internals to report errors correctly)
            asDefinition: true,
            // setting the _type definition at prop
            definition: "_type",
            // feed a root level type definition to typeCast an obj of types
            types: {
                _type: {
                    fn: (type) => (type && type._type && typeof type._type.fn == "function" ? type : undefined)
                }
            }
        });
        // expect type casting to have taken hold
        chai.expect(types).to.eql({
            a: {
                b: {
                    "***": {
                        "c|d": {
                            _type: {
                                fn: castInteger
                            }
                        }
                    }
                }
            }
        });
        

        done();
    });

});