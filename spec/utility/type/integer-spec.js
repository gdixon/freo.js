// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { integer, castInteger } from "../../../src/internal/utility/type/integer.js";

// set-up spec testing feature-set
describe("integer ~ from ~ freo/utility/type", function () {

    it("should create an integer when constructor is called", function (done) {
        // create a new instance... * note that we can only create an integer instance from an integer instance
        const input1 = "string", arr1 = integer(input1);
        // ensure the returned arr is an integer
        chai.expect(arr1).to.equal(0);
        // create a new instance... * note that we can only create an integer instance from an integer instance
        const input2 = "100.3", arr2 = integer(input2);
        // ensure the returned arr is an integer
        chai.expect(arr2).to.equal(100);
        // complete test with done
        done();
    });

    it("should cast value to integer", function (done) {
        // create a new instance... * note that we can only create an integer instance from an integer instance
        const input1 = "string", arr1 = castInteger(input1);
        // ensure the returned arr is a integer
        chai.expect(arr1).to.equal(undefined);
        // create a new instance... * note that we can only create an integer instance from an integer instance
        const input2 = "100.3", arr2 = castInteger(input2);
        // ensure the returned arr is an integer
        chai.expect(arr2).to.equal(100);
        // create a new instance... * note that we can only create an integer instance from an integer instance
        const input3 = undefined, arr3 = castInteger(input3);
        // ensure the returned arr is an integer
        chai.expect(arr3).to.equal(undefined);
        // complete test with done
        done();
    });


});