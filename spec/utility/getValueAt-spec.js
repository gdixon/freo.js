// import chai for testing
import chai from 'chai';

// test subject (get the value contained at a dot deliminated key position in a target Object or Array)
import { getValueAt } from "../../src/internal/utility/getValueAt.js";

// set-up spec testing feature-set
describe("getValueAt ~ from ~ freo/utility", function () {

    it("should get value given object and key", function (done) {
        // discover props in this obj
        const obj = { a: 1 };
        // check primitives match when equal
        chai.expect(getValueAt(obj)).to.eql({a: 1});
        // check primitives match when equal
        chai.expect(getValueAt(obj, "")).to.equal(obj);
        // check primitives match when equal
        chai.expect(getValueAt(obj, "a")).to.equal(1);
        // will fail on missing value
        chai.expect(getValueAt(obj, "a.b")).to.equal(undefined);
        // complete test with done
        done();
    });

    it("should get values given object and key that points to items in arrays (without scoping the item) retrieving keys and matching values and full match", function (done) {
        // get matches for this key
        const key = "a.*.b.*.c.*.d";
        // from this object
        const obj = { a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // expect it to match this when stringified
        const expectationKeys = `["a.1.b.0.c.0.d","a.1.b.0.c.1.d","a.1.b.0.c.2.d","a.1.b.1.c.0.d","a.1.b.1.c.1.d"]`;
        const expectationValues = `[1,2,3,4,5]`;
        // check primitives match when equal
        chai.expect(JSON.stringify(Object.keys(getValueAt(obj, key)))).to.equal(expectationKeys);
        chai.expect(JSON.stringify(Object.values(getValueAt(obj, key)))).to.equal(expectationValues);

        // complete test with done
        done();
    });

    it("should return empties if the key doesnt match any items", function (done) {
        // get this key
        const key = "a.*.c.*.d";
        // from this object
        const obj = { a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // expect it to match this when stringified
        let expectation = undefined;
        // check primitives match when equal
        chai.expect(getValueAt(obj, key)).to.eql(expectation);
        // complete test with done
        done();
    });

    it("should get values given array and key that points to items in arrays (without scoping the item) retrieving matching values", function (done) {
        // get this key
        const key = "*.b.*.c.*.d";
        // from this object
        const obj = [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }];
        // expect it to match this when stringified
        const expectation = `[1,2,3,4,5]`;
        // check primitives match when equal
        chai.expect(JSON.stringify(Object.values(getValueAt(obj, key)))).to.equal(expectation);
        // complete test with done
        done();
    });

    it("should get values given array and key that points at an option set retriving limited set of results", function (done) {
        // get this key
        const key = "0|1|2|3";
        // from this object
        const obj = [1,2,3,4,5];
        // expect it to match this when stringified
        const expectation = `[1,2,3,4]`;
        // check primitives match when equal
        chai.expect(JSON.stringify(Object.values(getValueAt(obj, key)))).to.equal(expectation);
        // complete test with done
        done();
    });

    it("should get values given array and key that points to items in wildcarded positions (scoping the item with options) retrieving matching values", function (done) {
        // get this key
        const key = "*.b.0.c.0|1.d";
        // from this object
        const obj = [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }];
        // expect it to match this when stringified
        const expectation = `[1,2]`;
        // check primitives match when equal
        chai.expect(JSON.stringify(Object.values(getValueAt(obj, key)))).to.equal(expectation);
        // complete test with done
        done();
    });

    it("should get values given object and key that points to items in arrays (without scoping the item) retrieving matching values", function (done) {
        // get this key
        const key = "a.**.d";
        // from this object
        const obj = { a: { 
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
        }};
        // expect it to match this when stringified
        const expectation = `[1,2,3,4,5]`;
        // check primitives match when equal
        chai.expect(JSON.stringify(Object.values(getValueAt(obj, key)))).to.equal(expectation);
        // complete test with done
        done();
    });

    it("should get values given object and key that points to items in arrays (without scoping the item) retrieving only matching values", function (done) {
        // get this key
        const key = "a.*.b.*.c.*.d";
        // from this object
        const obj = { a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // expect it to match this when stringified
        const expectation = `[1,2,3,4,5]`;
        // check primitives match when equal
        chai.expect(JSON.stringify(Object.values(getValueAt(obj, key)))).to.equal(expectation);
        // complete test with done
        done();
    });

    it("should get values given object and key that points to items in arrays using scope to get to a single value", function (done) {
        // get this key
        const key = "a.1.b.0.c.0.d";
        // from this object
        const obj = { a: [{}, { b: [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // expect it to match this when stringified
        const expectation = `1`;
        // check primitives match when equal
        chai.expect(JSON.stringify(getValueAt(obj, key))).to.equal(expectation);
        // complete test with done
        done();
    });
    
    it("should get not get any values if the key misses", function (done) {
        // get this key
        const key = "a.1.*.0.c.0.e";
        // from this object
        const obj = { a: [{}, { "*": [{ c: [{ d: 1 }, { d: 2 }, { d: 3 }] }, { c: [{ d: 4 }, { d: 5 }] }] }] };
        // expect it to match this when stringified
        const expectation = undefined;
        // check primitives match when equal
        chai.expect(JSON.stringify(getValueAt(obj, key, {disableWildcard: true}))).to.equal(expectation);
        // complete test with done
        done();
    });
    
});