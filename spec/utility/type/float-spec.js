// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { float, castFloat } from "../../../src/internal/utility/type/float.js";

// set-up spec testing feature-set
describe("float ~ from ~ freo/utility/type", function () {

    it("should create an float when constructor is called", function (done) {
        // create a new instance... * note that we can only create an float instance from an float instance
        const input1 = "string", arr1 = float(input1);
        // ensure the returned arr is an float
        chai.expect(arr1).to.equal(0);
        // create a new instance... * note that we can only create an float instance from an float instance
        const input2 = "100.3", arr2 = float(input2);
        // ensure the returned arr is an float
        chai.expect(arr2).to.equal(100.3);
        // complete test with done
        done();
    });

    it("should cast value to float", function (done) {
        // create a new instance... * note that we can only create an float instance from an float instance
        const input1 = "string", arr1 = castFloat(input1);
        // ensure the returned arr is a float
        chai.expect(arr1).to.equal(undefined);
        // create a new instance... * note that we can only create an float instance from an float instance
        const input2 = "100.3", arr2 = castFloat(input2);
        // ensure the returned arr is an float
        chai.expect(arr2).to.equal(100.3);
        // create a new instance... * note that we can only create an float instance from an float instance
        const input3 = undefined, arr3 = castFloat(input3);
        // ensure the returned arr is an float
        chai.expect(arr3).to.equal(undefined);
        // complete test with done
        done();
    });


});