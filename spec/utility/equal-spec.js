// import chai for testing
import chai from 'chai';

// test subject (check if two values are equal - deep checks for; Object, Array, ArrayBuffer, Date, String or Number)
import { equal } from "../../src/internal/utility/equal.js";

// set-up spec testing feature-set
describe("equal ~ from ~ freo/utility", function () {

    it("should check primitives are equal", function (done) {
        // check primitives match when equal
        chai.expect(equal(1, 1)).to.equal(true);
        // check primitives !match when !equal
        chai.expect(equal(1, 2)).to.equal(false);
        chai.expect(equal(1, "1")).to.equal(false);
        // complete test with done
        done();
    });

    it("should check arrays are equal", function (done) {
        // check arrays match when equal
        chai.expect(equal([1,2,3], [1,2,3])).to.equal(true);
        // check arrays !match when !equal
        chai.expect(equal([], [1])).to.equal(false);
        chai.expect(equal([1], [])).to.equal(false);
        chai.expect(equal([1], ["1"])).to.equal(false);
        // complete test with done
        done();
    });

    it("should check objects are equal", function (done) {
        // check objects match when equal
        chai.expect(equal({a:{b:{c:1}}}, {a:{b:{c:1}}})).to.equal(true);
        // check objects !match when !equal
        chai.expect(equal({a:{b:{c:1}}}, {})).to.equal(false);
        chai.expect(equal({}, {a:{b:{c:1}}})).to.equal(false);
        chai.expect(equal({a:{b:{c:1}}}, {a:{b:{c:2}}})).to.equal(false);
        // complete test with done
        done();
    });

    it("should check Dates are equal", function (done) {
        // create a new date instance
        const date = new Date();
        // check primitives match when equal
        chai.expect(equal(date, new Date(date.toString()))).to.equal(true);
        // check primitives !match when !equal
        chai.expect(equal(date, {})).to.equal(false);
        chai.expect(equal({}, date)).to.equal(false);
        // manipulate a timestamp in to the future (+10s)
        chai.expect(equal(date, new Date((date / 1) + 10000))).to.equal(false);
        // complete test with done
        done();
    });

    it("should check arrayBuffers are equal", function (done) {
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
        var buffer1 = stringToBuffer("test");
        var buffer2 = stringToBuffer("test");
        var buffer3 = stringToBuffer("tesg");
        var buffer4 = stringToBuffer("test2");
        // check primitives match when equal
        chai.expect(equal(buffer1, buffer2)).to.equal(true);
        // check primitives !match when !equal
        chai.expect(equal(buffer2, buffer3)).to.equal(false);
        chai.expect(equal(buffer2, buffer4)).to.equal(false);
        chai.expect(equal(buffer2, false)).to.equal(false);
        // complete test with done
        done();
    });
});