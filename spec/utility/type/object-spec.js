// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { object, castObject } from "../../../src/internal/utility/type/object.js";

// set-up spec testing feature-set
describe("object ~ from ~ freo/utility/type", function () {

    it("should create an Object when constructor is called", function (done) {
        // create a new instance... * note that we can only create an Object instance from an Object instance
        const input1 = "string", arr1 = object(input1);
        // ensure the returned arr is an Object
        chai.expect(typeof arr1 == "object").to.equal(true);
        // new object will be empty (not an object of ["string"])
        chai.expect(JSON.stringify(arr1)).to.equal("{}");
        // create a new instance... * note that we can only create an Object instance from an Object instance
        const input2 = {a: 1}, arr2 = object(input2);
        // ensure the returned arr is an Object
        chai.expect(typeof arr2 == "object").to.equal(true);
        // new object will be empty (not an object of ["string"])
        chai.expect(JSON.stringify(arr2)).to.equal("{\"a\":1}");
        // instances are not equal (shallow copy)
        chai.expect(input2).to.not.equal(arr2);
        // complete test with done
        done();
    });

    it("should cast value to Object", function (done) {
        // create a new instance... * note that we can only create an Object instance from an Object instance
        const input1 = "string", arr1 = castObject(input1);
        // ensure the returned arr is an Object
        chai.expect(typeof arr1 == "object").to.equal(false);
        // new object will be empty (not an object of ["string"])
        chai.expect(arr1).to.equal(undefined);
        // create a new instance... * note that we can only create an Object instance from an Object instance
        const input2 = {a: 1}, arr2 = castObject(input2);
        // ensure the returned arr is an Object
        chai.expect(typeof arr2 == "object").to.equal(true);
        // new object will be empty (not an object of ["string"])
        chai.expect(JSON.stringify(arr2)).to.equal("{\"a\":1}");
        // instances are not equal (shallow copy)
        chai.expect(input2).to.not.equal(arr2);
        // create a new instance... * note that we can only create an Object instance from an Object instance
        const input3 = undefined, arr3 = castObject(input3);
        // ensure the returned arr is an Object
        chai.expect(typeof arr3 == "object").to.equal(false);
        // new object will be empty (not an object of ["string"])
        chai.expect(arr3).to.equal(undefined);
        // complete test with done
        done();
    });


});