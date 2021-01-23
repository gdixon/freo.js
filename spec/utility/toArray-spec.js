// import chai for testing
import chai from 'chai';

// test subject (return an Array from an Array or a String)
import { toArray } from "../../src/internal/utility/toArray.js";

// set-up spec testing feature-set
describe("toArray ~ from ~ freo/utility", function () {

    it("should return array when passed a deliminated string", function (done) {
        // default deliminator is a single dot (.)
        chai.expect(toArray("test.string.delimination")).to.eql(["test", "string", "delimination"]);
        // deliminator can be provided as second arg
        chai.expect(toArray("test-string-delimination", "-")).to.eql(["test", "string", "delimination"]);
        // will expand braces and explode as if they were deliminated
        chai.expect(toArray("[test][string][delimination]")).to.eql(["test", "string", "delimination"]);
        // complete test with done
        done();
    });

    it("should return array when passed an Array", function (done) {
        // will always return an Array untouched
        chai.expect(toArray(["test", "string", "delimination"])).to.eql(["test", "string", "delimination"]);
        // complete test with done
        done();
    });

    it("should return array when passed a number or a bool", function (done) {
        // will always return an Array untouched
        chai.expect(toArray(0)).to.eql(["0"]);
        // will always return an Array untouched
        chai.expect(toArray("0")).to.eql(["0"]);
        // will always return an Array untouched
        chai.expect(toArray(false)).to.eql(["false"]);
        // will always return an Array untouched
        chai.expect(toArray("false")).to.eql(["false"]);
        // will always return an Array untouched
        chai.expect(toArray(true)).to.eql(["true"]);
        // will always return an Array untouched
        chai.expect(toArray("true")).to.eql(["true"]);
        // complete test with done
        done();
        
    });

    it("should return array when passed anything that cannot be stringified", function (done) {
        // overide objects toString method
        const noop = {
            toString: false
        }
        // will return an array holding an empty string as 0 entry
        chai.expect(toArray(noop)).to.eql([""]);
        
        // complete test with done
        done();
        
    });

    it("should return array holding response of .toString (split using deliminator)", function (done) {
        // check with object and split .toString response
        chai.expect(toArray({"a": 1}, " ")).to.eql(["object", "Object"]);
        // check with date object split by space
        chai.expect(toArray(new Date(0).toUTCString(), " ")).to.eql(["Thu,", "01", "Jan", "1970", "00:00:00", "GMT"]);

        // complete test with done
        done();
    });

    it("should return leave square braces intact if opted out", function (done) {
        // breaking braces can be optionally avoided
        chai.expect(toArray("[0]-[1]-[2]", "-", true)).to.eql(["[0]","[1]","[2]"]);
        // complete test with done
        done();
    });

});