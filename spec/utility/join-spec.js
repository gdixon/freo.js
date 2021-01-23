// import chai for testing
import chai from 'chai';

// test subject (join two objects or arrays to the left - * note that join is not like concat on Arrays (the values are placed according to index))
import { join } from "../../src/internal/utility/join.js";

// set-up spec testing feature-set
describe("join ~ from ~ freo/utility", function () {

    it("should join two nested objects together", function (done) {
        // initial object
        const obj1 = {a:{b:1}};
        const obj2 = {a:{c:1}};
        // check primitives match when equal
        chai.expect(join(obj1, obj2)).to.equal(obj1);
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(obj1)).to.equal("{\"a\":{\"b\":1,\"c\":1}}");
        // complete test with done
        done();
    });

    it("should join two nested objects together using immutable option", function (done) {
        // initial object
        const obj1 = {a:{b:1}};
        const obj2 = {a:{c:1}};
        // pull the a value expecting it to be immutable altered
        const testA = obj1.a
        // join the instances with nested immutability
        const joind = join(obj1, obj2, true);
        // check primitives match when equal
        chai.expect(joind).to.equal(obj1);
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(obj1)).to.equal("{\"a\":{\"b\":1,\"c\":1}}");
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(joind)).to.equal("{\"a\":{\"b\":1,\"c\":1}}");
        // nested object was shallowly recreated 
        chai.expect(testA).to.not.equal(joind.a);
        // complete test with done
        done();
    });

    it("should join two arrays together", function (done) {
        // initial object
        const obj1 = [[1,1,3,4], [1,1,3]];
        // object that we're moving too -- note that its the positions in the array that are being joind
        const obj2 = [[1,2], [2,,4]];
        // check primitives match when equal
        chai.expect(join(obj1, false, obj2)).to.equal(obj1);
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(obj1)).to.equal("[[1,1,3,4],[1,1,3],[1,2],[2,null,4]]");
        // complete test with done
        done();
    });

    it("should join two arrays together starting with an empty source", function (done) {
        // initial object
        const obj1 = [[1,1,3,4], [1,1,3]];
        // object that we're moving too -- note that its the positions in the array that are being joind
        const obj2 = [[1,2], [2,,4]];
        // join into an empty source (immutable)
        const joind = join([], obj1, false, obj2);
        // check primitives match when equal
        chai.expect(joind).to.not.equal(obj1);
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(joind)).to.equal("[[1,1,3,4],[1,1,3],[1,2],[2,null,4]]");
        // complete test with done
        done();
    });

    it("should join two nested arrays together", function (done) {
        // initial object
        const obj1 = {a:{b:[{a:1}]}};
        const obj2 = {a:{b:[{b:1}]}};
        // pull the a value expecting it to be immutable altered
        const testAB = obj1.a.b;
        // join the instances with nested immutability
        const joind = join(obj1, obj2);
        // check primitives match when equal
        chai.expect(joind).to.equal(obj1);
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(obj1)).to.equal("{\"a\":{\"b\":[{\"a\":1},{\"b\":1}]}}");
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(joind)).to.equal("{\"a\":{\"b\":[{\"a\":1},{\"b\":1}]}}");
        // nested object was shallowly recreated 
        chai.expect(testAB).to.equal(joind.a.b);
        // complete test with done
        done();
    });

    it("should join two nested arrays together using immutable option", function (done) {
        // initial object
        const obj1 = {a:{b:[{a:1}]}};
        const obj2 = {a:{b:[{b:1}]}};
        // pull the a value expecting it to be immutable altered
        const testAB = obj1.a.b;
        // join the instances with nested immutability
        const joind = join(obj1, false, obj2, true);
        // check primitives match when equal
        chai.expect(joind).to.equal(obj1);
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(obj1)).to.equal("{\"a\":{\"b\":[{\"a\":1},{\"b\":1}]}}");
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(joind)).to.equal("{\"a\":{\"b\":[{\"a\":1},{\"b\":1}]}}");
        // nested object was shallowly recreated 
        chai.expect(testAB).to.not.equal(joind.a.b);
        // complete test with done
        done();
    });

    it("should convert objects to Arrays and join that instead", function (done) {
        // initial object
        const obj1 = {a:{b:[{a:1}]}};
        const obj2 = {a:{b:{a:{b:1}}}};
        // pull the a value expecting it to be immutable altered
        const testAB = obj1.a.b;
        // join the instances with nested immutability
        const joind = join(obj1, false, obj2, true);
        // check primitives match when equal
        chai.expect(joind).to.equal(obj1);
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(obj1)).to.equal("{\"a\":{\"b\":[{\"a\":1},{\"b\":1}]}}");
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(joind)).to.equal("{\"a\":{\"b\":[{\"a\":1},{\"b\":1}]}}");
        // nested object was shallowly recreated 
        chai.expect(testAB).to.not.equal(joind.a.b);
        // complete test with done
        done();
    });

    it("should convert Arrays to Objects and join that instead", function (done) {
        // initial object
        const obj1 = {a:{b:{a:{b:1}}}};
        const obj2 = {a:{b:[{a:1}]}};
        // pull the a value expecting it to be immutable altered
        const testAB = obj1.a.b;
        // join the instances with nested immutability
        const joind = join(obj1, false, obj2, true);
        // check primitives match when equal
        chai.expect(joind).to.equal(obj1);
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(obj1)).to.equal("{\"a\":{\"b\":{\"0\":{\"a\":1},\"a\":{\"b\":1}}}}");
        // expect the join to update the first obj it was provided
        chai.expect(JSON.stringify(joind)).to.equal("{\"a\":{\"b\":{\"0\":{\"a\":1},\"a\":{\"b\":1}}}}");
        // nested object was shallowly recreated 
        chai.expect(testAB).to.not.equal(joind.a.b);
        // complete test with done
        done();
    });

    it("should allow for merging into an empty object to perform an immutable shallow clone of the source", function (done) {
        // initial object
        const obj1 = {a:{b:1}};
        const obj2 = [{a:{b:1}}];
        // merging into an empty wrapper will perform an immutable clone of the content
        chai.expect(join({}, obj1)).to.eql(obj1);
        // the outside reference will not be equal
        chai.expect(join({}, obj1)).to.not.equal(obj1);
        // the content stored within is recycled
        chai.expect(join({}, obj1).a).to.eql(obj1.a);
        // merging into an empty wrapper will perform an immutable clone of the content
        chai.expect(join([], obj2)).to.eql(obj2);
        // the outside reference will not be equal
        chai.expect(join([], obj2)).to.not.equal(obj2);
        // the content stored within is recycled
        chai.expect(join([], obj2)[0]).to.equal(obj2[0]);
        // complete test with done
        done();
    });
    
});