// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { getType } from "../../src/internal/utility/getType.js";

// set-up spec testing feature-set
describe("getType ~ from ~ freo/utility", function () {

    it("should get type casting methods given name", function (done) {
        // check primitives match when equal
        chai.expect(getType("array")([])).to.eql([]);
        chai.expect(getType("arrayBuffer")(new ArrayBuffer())).to.eql(new ArrayBuffer());
        chai.expect(getType("bool")(true)).to.eql(true);
        chai.expect(getType("date")(new Date(0))).to.eql(new Date(0));
        chai.expect(getType("float")(10.3)).to.eql(10.3);
        chai.expect(getType("number")(10.3)).to.eql(10.3);
        chai.expect(getType("integer")(10.3)).to.eql(10);
        chai.expect(getType("object")({a:1})).to.eql({a:1});
        chai.expect(getType("string")("string")).to.eql("string");
        // passes function types straight through
        chai.expect(getType((v) => v)("string")).to.eql("string");
        // complete test with done
        done();
    });


});