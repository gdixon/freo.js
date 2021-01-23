// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { date, castDate } from "../../../src/internal/utility/type/date.js";

// set-up spec testing feature-set
describe("date ~ from ~ freo/utility/type", function () {

    it("should create an date when constructor is called", function (done) {
        // create a new instance... * note that we can only create an date instance from an date instance
        const input1 = "string", arr1 = date(input1);
        // ensure the returned arr is an date
        chai.expect(arr1 instanceof Date).to.equal(true);
        // create a new instance... * note that we can only create an date instance from an date instance
        const input2 = new Date(), arr2 = date(input2);
        // ensure the returned arr is an date
        chai.expect(input2.toString()).to.equal(arr2.toString());
        // complete test with done
        done();
    });

    it("should cast value to date", function (done) {
        // create a new instance... * note that we can only create an date instance from an date instance
        const input1 = "string", arr1 = castDate(input1);
        // ensure the returned arr is a date
        chai.expect(arr1 instanceof Date).to.equal(false);
        // create a new instance... * note that we can only create an date instance from an date instance
        const input2 = new Date(), arr2 = castDate(input2);
        // ensure the returned arr is an date
        chai.expect(input2.toString()).to.equal(arr2.toString());
        // create a new instance... * note that we can only create an date instance from an date instance
        const input3 = undefined, arr3 = castDate(input3);
        // ensure the returned arr is an date
        chai.expect(arr3 instanceof Date).to.equal(false);
        // complete test with done
        done();
    });


});