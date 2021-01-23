// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { array, castArray } from "../../../src/internal/utility/type/array.js";

// set-up spec testing feature-set
describe("array ~ from ~ freo/utility/type", function () {

    it("should create an Array when constructor is called", function (done) {
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input1 = "string", arr1 = array(input1);
        // ensure the returned arr is an Array
        chai.expect(Array.isArray(arr1)).to.equal(true);
        // new array will be empty (not an array of ["string"])
        chai.expect(JSON.stringify(arr1)).to.equal("[]");
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input2 = [1,2,3], arr2 = array(input2);
        // ensure the returned arr is an Array
        chai.expect(Array.isArray(arr2)).to.equal(true);
        // new array will be empty (not an array of ["string"])
        chai.expect(JSON.stringify(arr2)).to.equal("[1,2,3]");
        // instances are not equal (shallow copy)
        chai.expect(input2).to.not.equal(arr2);
        // complete test with done
        done();
    });

    it("should cast value to Array", function (done) {
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input1 = "string", arr1 = castArray(input1);
        // ensure the returned arr is an Array
        chai.expect(Array.isArray(arr1)).to.equal(false);
        // new array will be empty (not an array of ["string"])
        chai.expect(arr1).to.equal(undefined);
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input2 = [1,2,3], arr2 = castArray(input2);
        // ensure the returned arr is an Array
        chai.expect(Array.isArray(arr2)).to.equal(true);
        // new array will be empty (not an array of ["string"])
        chai.expect(JSON.stringify(arr2)).to.equal("[1,2,3]");
        // instances are not equal (shallow copy)
        chai.expect(input2).to.not.equal(arr2);
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input3 = undefined, arr3 = castArray(input3);
        // ensure the returned arr is an Array
        chai.expect(Array.isArray(arr3)).to.equal(false);
        // new array will be empty (not an array of ["string"])
        chai.expect(arr3).to.equal(undefined);
        // complete test with done
        done();
    });


});