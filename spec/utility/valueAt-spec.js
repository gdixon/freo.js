// import chai for testing
import chai from 'chai';

// test subject (get the value contained at a dot deliminated key position in a target Object or Array)
import { valueAt } from "../../src/internal/utility/valueAt.js";

// set-up spec testing feature-set
describe("valueAt ~ from ~ freo/utility", function () {

    // this is mainly grabbing at branches -- for thorough testing see ./setValueAt-spec.js and ./getValueAt-spec.js which implement valueAt.js
    it("should get value given object and key and callback to appropriate methods with discoveries", function (done) {
        // fill discovered
        const discovered = {};
        // valueAt doesnt do alot without options...
        chai.expect(valueAt(obj, undefined, "", 0)).to.equal(undefined);
        // recreate getValueAt here...
        const options = {
            // method to process the root node
            rootDiscover: (working, keyPrefix) => {
                // record the discovery
                discovered[keyPrefix] = working;

                // return the working position as root/response
                return working;
            },
            // method to call when a value is discovered (on a recursion path)
            recurseDiscover: (working, keyPrefix) => {
                // record the discovery
                discovered[keyPrefix] = working;

                // return the item
                return working;
            },
            // methods to process the nested case
            nestedDiscover: (working, keyPrefix, childKey) => {
                // check if this property should be written according to creationMaxDepth (0 == if it currently exists then write to it)
                if (Object.prototype.hasOwnProperty.call(working, childKey)) {
                    // set the value at final position and merge into the current collection
                    discovered[keyPrefix + (keyPrefix ? "." : "") + childKey] = working[childKey];
                }
            }
        };
        // method to absorb response into working obj (would allow us to work immutable/mutable in sets)
        const absorbers = {
            absorbOptions: (working) => {

                return { working: working, response: working }
            },
            absorbChild: (working) => {

                return { working: working, response: working }
            },
            absorbRoot: (working) => {

                return { working: working, response: working }
            }
        }
        // discover props in this obj
        const obj = { a: 1, b: { c: { d: 1 } }, c: { d: 1, e: 1 }, d: { e: { f: { g: 1, h: 1, i: {} } } }, e: { f: 1, g: 1, h: { i: { j: 1 } } } };
        // run valueAt to fill discovered
        valueAt(obj, undefined, "", 0, options);
        valueAt(obj, ["a"], "", 0, options);
        valueAt(obj, ["a", "b"], "", 0, options);
        valueAt(obj, ["b", "**", "d"], "", 0, { hasSpecials: true, ...options, ...absorbers });
        valueAt(obj, ["c", "d|e"], "", 0, { hasSpecials: true, ...options, ...absorbers });
        valueAt(obj, ["d", "**", "f|g"], "", 0, { hasSpecials: true, ...options, ...absorbers });
        // same again but without the absorbers to cover the branch (theyre optional)
        valueAt(obj, ["b", "**", "d"], "", 0, { hasSpecials: true, ...options });
        valueAt(obj, ["c", "d|e"], "", 0, { hasSpecials: true, ...options });
        // this wont collect
        valueAt(obj, ["d", "**", "**", "**", "g|h"], "", 0, { hasSpecials: true, ...options });
        // this will
        valueAt(obj, ["d", "**", "**", "g|h"], "", 0, { hasSpecials: true, ...options });
        // end with a splat to keep recursing till end
        valueAt(obj, ["e", "**"], "", 0, { hasSpecials: true, ...options });
        // end with a splat to keep recursing till end
        valueAt(obj, ["e", "*"], "", 0, { hasSpecials: true, ...options });
        // check primitives match when equal
        chai.expect(discovered[""]).to.eql(obj);
        // check primitives match when equal
        chai.expect(discovered["a"]).to.equal(1);
        // will fail on missing value
        chai.expect(discovered["a.b"]).to.equal(undefined);
        // check primitives match when equal
        chai.expect(discovered["b.c.d"]).to.equal(1);
        // check primitives match when equal
        chai.expect(discovered["c.d"]).to.equal(1);
        chai.expect(discovered["c.e"]).to.equal(1);
        // check primitives match when equal
        chai.expect(discovered["d.e.f.g"]).to.equal(1);
        chai.expect(discovered["d.e.f.h"]).to.equal(1);
        // check primitives match when equal
        chai.expect(discovered["e.f"]).to.equal(1);
        chai.expect(discovered["e.g"]).to.equal(1);
        chai.expect(discovered["e.h.i.j"]).to.equal(1);
        chai.expect(discovered["e.h"]).to.eql({ i: { j: 1 } });
        // complete test with done
        done();
    });

});