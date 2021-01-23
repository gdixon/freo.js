// import chai for testing
import chai from 'chai';

// test subject (reports the type of the raw value held against an instance (with a .raw method))
import { arrayBuffer, castArrayBuffer } from "../../../src/internal/utility/type/arrayBuffer.js";

// create buffer from string
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

// get string from buffer
function bufferTostring(buf) {

    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

// set-up spec testing feature-set
describe("arrayBuffer ~ from ~ freo/utility/type", function () {

    it("should create an ArrayBuffer when constructor is called", function (done) {
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input1 = "string", arr1 = arrayBuffer(input1);
        // ensure the returned arr is an Array
        chai.expect(arr1 instanceof ArrayBuffer).to.equal(true);
        // new array will be empty (not an array of ["string"])
        chai.expect(JSON.stringify(arr1)).to.equal("{}");
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input2 = stringToBuffer("string"), arr2 = arrayBuffer(input2);
        // ensure the returned arr is an Array
        chai.expect(arr2 instanceof ArrayBuffer).to.equal(true);
        // new arrayBuffer will contain the string "string"
        chai.expect(bufferTostring(arr2)).to.equal("string");
        // instances are not equal (shallow copy)
        chai.expect(input2).to.not.equal(arr2);
        // complete test with done
        done();
    });

    it("should cast value to ArrayBuffer", function (done) {
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input1 = "string", arr1 = castArrayBuffer(input1);
        // ensure the returned arr is an Array
        chai.expect(arr1 instanceof ArrayBuffer).to.equal(false);
        // new array will be empty (not an array of ["string"])
        chai.expect(arr1).to.equal(undefined);
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input2 = stringToBuffer("string"), arr2 = castArrayBuffer(input2);
        // ensure the returned arr is an Array
        chai.expect(arr2 instanceof ArrayBuffer).to.equal(true);
        // new arrayBuffer will contain the string "string"
        chai.expect(bufferTostring(arr2)).to.equal("string");
        // instances are not equal (deep clone)
        chai.expect(input2).to.not.equal(arr2);
        // create a new instance... * note that we can only create an Array instance from an Array instance
        const input3 = undefined, arr3 = castArrayBuffer(input3);
        // ensure the returned arr is an Array
        chai.expect(arr3 instanceof ArrayBuffer).to.equal(false);
        // new array will be empty (not an array of ["string"])
        chai.expect(arr3).to.equal(undefined);
        // complete test with done
        done();
    });

});