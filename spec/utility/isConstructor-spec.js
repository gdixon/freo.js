// import chai for testing
import chai from 'chai';

// test subject (check if given value is a Primitive Object or Array)
import { isConstructor } from "../../src/internal/utility/isConstructor.js";

// dummy class - not a Primitive object
class Dummy {}

// set-up spec testing feature-set
describe("isConstructor ~ from ~ freo/utility", function () {

    it("should check for false cases", function (done) {
        // ensure values get false
        chai.expect(isConstructor(0)).to.equal(false);
        chai.expect(isConstructor(1)).to.equal(false);
        chai.expect(isConstructor(true)).to.equal(false);
        chai.expect(isConstructor(false)).to.equal(false);
        chai.expect(isConstructor("string")).to.equal(false);
        chai.expect(isConstructor(undefined)).to.equal(false);
        chai.expect(isConstructor(null)).to.equal(false);
        // Types that extend object
        chai.expect(isConstructor(new Date())).to.equal(false);
        chai.expect(isConstructor(new ArrayBuffer())).to.equal(false);

        // Class method extends object
        chai.expect(isConstructor(new Dummy())).to.equal(false);

        // complete test with done
        done();
    });

    it("should check for passing cases", function (done) {
        // expect only class instances that havent been constructed yet
        chai.expect(isConstructor(Dummy)).to.equal(true);

        // complete test with done
        done();
    });

});