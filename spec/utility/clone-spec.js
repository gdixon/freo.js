// import chai for testing
import chai from 'chai';

// test subject (deep clone an; Object, Array, ArrayBuffer, Date, String or Number)
import { clone } from "../../src/internal/utility/clone.js";

// set-up spec testing feature-set
describe("clone ~ from ~ freo/utility", function () {

    it("should check primitives can be cloned", function (done) {
        // check primitives match when equal
        chai.expect(clone(1)).to.equal(1);
        chai.expect(clone("1")).to.equal("1");
        // complete test with done
        done();
    });

    it("should check arrays can be cloned", function (done) {
        // check arrays match when cloned
        chai.expect(clone([1,2,3])).to.eql([1,2,3]);
        chai.expect(clone([])).to.eql([]);
        // complete test with done
        done();
    });

    it("should check objects can be cloned", function (done) {
        // check arrays match when cloned
        chai.expect(clone({a:1,b:1})).to.eql({a:1,b:1});
        chai.expect(clone({})).to.eql({});
        // complete test with done
        done();
    });

    it("should check Dates can be cloned", function (done) {
        // create a new date instance
        const date = new Date();
        // check primitives match when equal
        chai.expect(clone(date)).to.eql(date);
        // complete test with done
        done();
    });

    it("should check arrayBuffers can be cloned", function (done) {
        const stringToBuffer = (str) => {
            // ArrayBuffer to match length of the str
            const buffer = new ArrayBuffer(str.length);
            // Uint8 to contain the char info
            const view = new Uint8Array(buffer);
            // place the char into the buffer as unit8Array
            for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i);

            // returning the buffer
            return buffer;
        }
        // get an array buffer
        var buffer = stringToBuffer("test");
        // check primitives match when equal
        chai.expect(clone(buffer)).to.eql(buffer);
        // complete test with done
        done();
    });
});