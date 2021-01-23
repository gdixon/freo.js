// import chai for testing
import chai from 'chai';

// test subject (return an Array from an Array or a String)
import { escapeRegExp } from "../../src/internal/utility/escapeRegExp.js";

// set-up spec testing feature-set
describe("escapeRegExp ~ from ~ freo/utility", function () {

    it("should return string with regex specials escaped with \"\\\" escape char", function (done) {
        // will escape special chars
        chai.expect(escapeRegExp(".")).to.equal("\\\.");
        // will escape any number of chars
        chai.expect(escapeRegExp("[]")).to.equal("\\\[\\\]");
        // will return empty string if provided empty string
        chai.expect(escapeRegExp("")).to.equal("");
        // complete test with done
        done();
    });

    it("should allow for exceptions to stop escapement of particular chars", function (done) {
        // exceptions can be a string of exceptions
        chai.expect(escapeRegExp("[-.$]", "-.$")).to.equal("\\\[-.$\\\]");
        // or an array of exceptions
        chai.expect(escapeRegExp("[-.$]", ["-",".","$"])).to.equal("\\\[-.$\\\]");
        // anything else fed to exceptions is ignored
        chai.expect(escapeRegExp("[-.$]", {"-":1,".":1,"$":1})).to.equal("\\\[\\\-\\\.\\\$\\\]");
        // complete test with done
        done();
    });

});