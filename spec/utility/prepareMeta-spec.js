// import chai for testing
import chai from 'chai';

// test subject (set a value at a dot deliminated key position within an Object or an Array (*note that this operation is mutable))
import { prepareMeta } from "../../src/internal/utility/prepareMeta.js";

// set-up spec testing feature-set
describe("prepareMeta ~ from ~ freo/utility", function () {

    it("should default an object into the given object at named position (mutable)", function (done) {
        // initial object
        const options = {};
        // create an immutable clone
        const response = prepareMeta("test", options);
        // check primitives match when equal
        chai.expect(response).to.eql({});

        // complete test with done
        done();
    });

    it("should push obj if property defined as Array (mutable)", function (done) {
        // initial object
        const options = {
            test: []
        };
        // create an immutable clone
        const response = prepareMeta("test", options);
        // check primitives match when equal
        chai.expect(response).to.eql({});
        // placed in position
        chai.expect(options.test[0]).to.equal(response);

        // complete test with done
        done();
    });

    it("should default an object if provided anything but object (mutable)", function (done) {
        // initial object
        const options = {
            test: "string"
        };
        // create an immutable clone
        const response = prepareMeta("test", options);
        // check primitives match when equal
        chai.expect(response).to.eql({});

        // complete test with done
        done();
    });

    it("should curry through the same object thats already set", function (done) {
        // initial object
        const options = {
            test: {}
        };
        // value we're currently referencing
        const current = options.test;
        // create an immutable clone
        const response = prepareMeta("test", options);
        // check primitives match when equal
        chai.expect(response).to.eql(current);
        // placed in position
        chai.expect(options.test).to.equal(response);

        // complete test with done
        done();
    });


});
