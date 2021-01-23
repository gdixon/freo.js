// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { bool, castBool } from "../../../src/internal/utility/type/bool.js";

// set-up spec testing feature-set
describe("bool ~ from ~ freo/utility/type", function () {

    it("should create an bool when constructor is called", function (done) {
        // create a new instance... * note that we can only create an bool instance from an bool instance
        const input1 = "string", arr1 = bool(input1);
        // ensure the returned arr is an bool
        chai.expect(arr1).to.equal(false);
        // create a new instance... * note that we can only create an bool instance from an bool instance
        const input2 = true, arr2 = bool(input2);
        // ensure the returned arr is an bool
        chai.expect(arr2).to.equal(true);
        // complete test with done
        done();
    });

    it("should cast value to bool", function (done) {
        // create a new instance... * note that we can only create an bool instance from an bool instance
        const input1 = "string", arr1 = castBool(input1);
        // ensure the returned arr is a bool
        chai.expect(arr1).to.equal(undefined);
        // create a new instance... * note that we can only create an bool instance from an bool instance
        const input2 = true, arr2 = castBool(input2);
        // ensure the returned arr is an bool
        chai.expect(arr2).to.equal(true);
        // create a new instance... * note that we can only create an bool instance from an bool instance
        const input3 = false, arr3 = castBool(input3);
        // ensure the returned arr is an bool
        chai.expect(arr3).to.equal(false);
        // create a new instance... * note that we can only create an bool instance from an bool instance
        const input4 = undefined, arr4 = castBool(input4);
        // ensure the returned arr is an bool
        chai.expect(arr4).to.equal(undefined);
        // complete test with done
        done();
    });


});