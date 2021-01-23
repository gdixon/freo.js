// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { string, castString } from "../../../src/internal/utility/type/string.js";

// set-up spec testing feature-set
describe("string ~ from ~ freo/utility/type", function () {

    it("should create an string when constructor is called", function (done) {
        // create a new instance... * note that we can only create an string instance from an string instance
        const input1 = "string", arr1 = string(input1);
        // ensure the returned arr is an string
        chai.expect(arr1).to.equal("string");
        // create a new instance... * note that we can only create an string instance from an string instance
        const input2 = 100, arr2 = string(input2);
        // ensure the returned arr is a string
        chai.expect(arr2).to.equal("100");
        // create a new instance... * note that we can only create an string instance from an string instance
        const input3 = undefined, arr3 = string(input3);
        // ensure the returned arr is a string
        chai.expect(arr3).to.equal("");
        // complete test with done
        done();
    });

    it("should cast value to string", function (done) {
        // create a new instance... * note that we can only create an string instance from an string instance
        const input1 = "string", arr1 = castString(input1);
        // ensure the returned arr is a string
        chai.expect(arr1).to.equal("string");
        // create a new instance... * note that we can only create an string instance from an string instance
        const input2 = 100, arr2 = castString(input2);
        // ensure the returned arr is an string
        chai.expect(arr2).to.equal("100");
        // create a new instance... * note that we can only create an string instance from an string instance
        const input3 = undefined, arr3 = castString(input3);
        // ensure the returned arr is a string
        chai.expect(arr3).to.equal(undefined);
        // complete test with done
        done();
    });


});