// import chai for testing
import chai from 'chai';

// test subject (check if given value is a Primitive Object or Array)
import { isObject } from "../../src/internal/utility/isObject.js";

// dummy class - not a Primitive object
class Dummy {}

// set-up spec testing feature-set
describe("isObject ~ from ~ freo/utility", function () {

    it("should check for false cases", function (done) {
        // ensure values get false
        chai.expect(isObject(0)).to.equal(false);
        chai.expect(isObject(1)).to.equal(false);
        chai.expect(isObject(true)).to.equal(false);
        chai.expect(isObject(false)).to.equal(false);
        chai.expect(isObject("string")).to.equal(false);
        chai.expect(isObject(undefined)).to.equal(false);
        chai.expect(isObject(null)).to.equal(false);
        // Types that extend object
        chai.expect(isObject(new Date())).to.equal(false);
        chai.expect(isObject(new ArrayBuffer())).to.equal(false);

        // Class method extends object
        chai.expect(isObject(new Dummy())).to.equal(false);

        // complete test with done
        done();
    });

    it("should check for passing cases", function (done) {
        // expect only Primitive Array and Obj to be true
        chai.expect(isObject({})).to.equal(true);
        chai.expect(isObject([])).to.equal(true);

        // complete test with done
        done();
    });

});