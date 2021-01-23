// import chai for testing
import chai from 'chai';

// test subject (reports the route of the raw value held against an instance (with a .raw method))
import { hasDefinition } from "../../src/internal/utility/hasDefinition.js";

// sort-of prefix-tree to represent the types construct - using { the default of } _type { as options.definition } to contain the nodes
const types = {
    "_type": {
        "fn": () => {

            return -1
        },
    },
    "0": {
        "a": {
            "_type": {
                "weight": 1,
                "fn": function () {

                    return 0
                }
            }
        },
        "***": {
            "b|c": {
                "_type": {
                    "fn": function () {

                        return 1
                    }
                }
            }
        },
        "**": {
            "_type": {
                "fn": function () {

                    return 2
                }
            }
        }
    },
    "*": {
        "_type": {
            "fn": function () {

                return 3
            }
        }
    }
};

// slightly more complex routes construct - using _route as { options.definition }
const routes = {
    "_route": {
        "fn": () => {

            return -1
        },
        "weight": 1,
    },
    "0": {
        "_route": {
            "fn": () => {

                return 0
            }
        },
        "a": {
            "1": {
                "b": {
                    "0": {
                        "c": {
                            "0": {
                                "d": {
                                    "e": {
                                        "_route": {
                                            "fn": () => {

                                                return 1
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "*": {
                        "c": {
                            "*": {
                                "d": {
                                    "e": {
                                        "_route": {
                                            "fn": () => {

                                                return 2
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "*": {
                "b": {
                    "0": {
                        "c": {
                            "*": {
                                "d": {
                                    "e": {
                                        "_route": {
                                            "fn": () => {

                                                return 3
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "*": {
                        "c": {
                            "*": {
                                "d": {
                                    "e": {
                                        "_route": {
                                            "fn": () => {

                                                return 4
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "*": {
        "a": {
            "*": {
                "b": {
                    "*": {
                        "c": {
                            "*": {
                                "d": {
                                    "e": {
                                        "_route": {
                                            "fn": () => {

                                                return 5
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "**": {
        "f": {
            "_route": {
                "fn": () => {

                    return 6
                }
            }
        },
        "e": {
            "_route": {
                "fn": () => {

                    return 7
                }
            },
            "f": {
                "_route": {
                    "fn": () => {

                        return 8
                    }
                },
                "**": {
                    "e": {
                        "*": {
                            "_route": {
                                "fn": () => {

                                    return 9
                                }
                            }
                        }
                    }
                }
            }
        },
    },
    "4": {
        "**": {
            "f": {
                "_route": {
                    "fn": () => {

                        return 10
                    }
                }
            },
            "e": {
                "**": {
                    "_route": {
                        "fn": () => {

                            return 11
                        }
                    }
                }
            },
            "d": {
                "***": {
                    "a|b": {
                        "_route": {
                            "fn": () => {

                                return 12
                            }
                        }
                    }
                }
            }
        }
    }
};

// pass in a set of options to make hasDefinition work as a URI router
const options = {
    // where is the definition located in the structure
    definition: "_route",
    // how should the keys be parsed and represented
    deliminator: "/"
};

// set-up spec testing feature-set
describe("hasDefinition ~ from ~ freo/utility", function () {

    it("should discover _type given a key which fits available types", function (done) {
        // setup hasDefinition to work on types (default functionality)
        const type1 = hasDefinition(types, "0.a");
        // expect 2 matches
        chai.expect(type1.keys.length).to.equal(2);
        // expect the matches to have been ordered correctly
        chai.expect(type1.keys).to.eql(["0.a", "0.**"]);
        // should have discovered correct matching _type
        chai.expect(type1.keys[0]).to.equal("0.a");
        // check the definition was recorded correctly
        chai.expect(type1.defintions[type1.keys[0]]()).to.equal(0);
        // check the definition was recorded correctly
        chai.expect(type1.defintions[type1.keys[1]]()).to.equal(2);
        // if we call to args with the matched key we can gather the matches details/arguments
        chai.expect(type1.args(type1.keys[0])).to.eql(['0', 'a']);
        // if we call to args with the matched key we can gather the matches details/arguments
        chai.expect(type1.args(type1.keys[1])).to.eql(['0', 'a']);

        done();
    });

    it("should discover _type given a key which matches on an options wildcard and a greedy wildcard", function (done) {
        // setup hasDefinition to work on types (default functionality - { definition: "_type", deliminator: "." })
        const type2 = hasDefinition(types, "0.b");
        // expect 2 to matches
        chai.expect(type2.keys.length).to.equal(2);
        // expect the matches to have been ordered correctly
        chai.expect(type2.keys).to.eql(["0.b|c", "0.**"]);
        // check the definition was recorded correctly
        chai.expect(type2.defintions[type2.keys[0]]()).to.equal(1);
        // check the definition was recorded correctly
        chai.expect(type2.defintions[type2.keys[1]]()).to.equal(2);
        // if we call to args with the matched key we can gather the matches details/arguments
        chai.expect(type2.args(type2.keys[0])).to.eql(['0', 'b']);
        // expect the same breakdown for greedy wildcard too
        chai.expect(type2.args(type2.keys[1])).to.eql(['0', 'b']);

        done();
    });

    it("should discover _type given a key which matches on a greedy wildcard", function (done) {
        // setup hasDefinition to work on types (default functionality)
        const type3 = hasDefinition(types, "0.d.d.d.d");
        // expect 1 match
        chai.expect(type3.keys.length).to.equal(1);
        // check that the defintions were ordered correctly
        chai.expect(type3.defintions[type3.keys[0]]()).to.equal(2);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(type3.args(type3.keys[0])).to.eql(['0', 'd.d.d.d']);

        done();
    });

    it("should discover _type given a key which matches a single wildcard position at root", function (done) {
        // setup hasDefinition to work on types (default functionality)
        const type4 = hasDefinition(types, "1");
        // expect no matches
        chai.expect(type4.keys.length).to.equal(1);
        // check that the defintions were ordered correctly
        chai.expect(type4.defintions[type4.keys[0]]()).to.equal(3);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(type4.args(type4.keys[0])).to.eql(['1']);

        done();
    });

    it("should not discover anything if a key fails to match available definitions", function (done) {
        // setup hasDefinition to work on types (default functionality)
        const type5 = hasDefinition(types, "1.d");
        // expect no matches
        chai.expect(type5.keys.length).to.equal(0);
        // .args expects one parameter and it should be a full flat key to a _type definition (can never return anything but false if keys is empty)
        chai.expect(type5.args()).to.eql(false);

        done();
    });

    it("should discover definitions from the root of the tree if key is provided as empty str (or undefined)", function (done) {
        // get routes corresponding to key
        const type6 = hasDefinition(types, "");
        // expect 1 matches
        chai.expect(type6.keys.length).to.equal(1);
        // expect to only match on the full wildcard route
        chai.expect(type6.defintions[type6.keys[0]]()).to.equal(-1);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(type6.args(type6.keys[0])).to.eql([""]);

        done();
    });

    it("should not discover anything if the provided obj is not defined", function (done) {
        // get routes corresponding to key
        const type7 = hasDefinition(undefined, "a.b");
        // expect no matches
        chai.expect(type7.keys.length).to.equal(0);


        done();
    });

    it("should not discover anything if the provided obj is not an obj", function (done) {
        // get routes corresponding to key
        const type8 = hasDefinition([], "a.b");
        // expect no matches
        chai.expect(type8.keys.length).to.equal(0);

        done();
    });

    it("should discover definitions as a URI router given options that setup the use case", function (done) {
        // get routes corresponding to key 
        const route1 = hasDefinition(routes, "0/a/1/b/0/c/0/d/e", options);
        // expect 6 matches
        chai.expect(route1.keys.length).to.equal(6);
        // console.log(route1);
        // console.log(route1.keys.map((key) => route1.defintions[key]()));
        // console.log(route1.keys.map((key) => route1.args(key)));
        // check that the defintions were ordered correctly
        chai.expect(route1.defintions[route1.keys[0]]()).to.equal(1);
        chai.expect(route1.defintions[route1.keys[1]]()).to.equal(2);
        chai.expect(route1.defintions[route1.keys[2]]()).to.equal(3);
        chai.expect(route1.defintions[route1.keys[3]]()).to.equal(4);
        chai.expect(route1.defintions[route1.keys[4]]()).to.equal(5);
        chai.expect(route1.defintions[route1.keys[5]]()).to.equal(7);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(route1.args(route1.keys[0])).to.eql(['0', 'a', '1', 'b', '0', 'c', '0', 'd', 'e']);
        chai.expect(route1.args(route1.keys[1])).to.eql(['0', 'a', '1', 'b', '0', 'c', '0', 'd', 'e']);
        chai.expect(route1.args(route1.keys[2])).to.eql(['0', 'a', '1', 'b', '0', 'c', '0', 'd', 'e']);
        chai.expect(route1.args(route1.keys[3])).to.eql(['0', 'a', '1', 'b', '0', 'c', '0', 'd', 'e']);
        chai.expect(route1.args(route1.keys[4])).to.eql(['0', 'a', '1', 'b', '0', 'c', '0', 'd', 'e']);
        // also matches on **.e
        chai.expect(route1.args(route1.keys[5])).to.eql(['0/a/1/b/0/c/0/d', 'e']);

        done();
    });

    it("should discover definitions from wildcarded positions", function (done) {
        // get routes corresponding to key 
        const route2 = hasDefinition(routes, "4/a/1/b/0/c/0/d/e", options);
        // expect 2 matches
        chai.expect(route2.keys.length).to.equal(2);
        // expect to only match on the full wildcard route
        chai.expect(route2.defintions[route2.keys[0]]()).to.equal(5);

        done();
    });

    it("should discover definitions matching a single index from the top of the tree", function (done) {
        // get routes corresponding to key
        const route3 = hasDefinition(routes, "0", options);
        // expect 1 matches
        chai.expect(route3.keys.length).to.equal(1);
        // expect to only match on the full wildcard route
        chai.expect(route3.defintions[route3.keys[0]]()).to.equal(0);

        done();
    });

    it("should not discover anything if a key fails to match available definitions", function (done) {
        // get routes corresponding to key 
        const route4 = hasDefinition(routes, "0/a", options);
        // expect to only match on the full wildcard route
        chai.expect(route4.keys.length).to.equal(0);

        done();
    });

    it("should discover definitions at a nested key and resolve arguments", function (done) {
        // get routes corresponding to key 
        const route5 = hasDefinition(routes, "4/10/s/d/h/f", options);
        // expect 2 matches
        chai.expect(route5.keys.length).to.equal(2);
        // expect to only match on the full wildcard route **/f or 4/**/f
        chai.expect(route5.defintions[route5.keys[0]]()).to.equal(10);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(route5.args(route5.keys[0])).to.eql(['4', '10/s/d/h', 'f']);

        done();
    });

    it("should discover definitions that met wildcards and sort the results in dificulty to match order", function (done) {
        // get routes corresponding to key 
        const route6 = hasDefinition(routes, "4/10/s/d/h/e/f", options);
        // expect 4 matches
        chai.expect(route6.keys.length).to.equal(4);
        // expect to only match on the full wildcard route
        chai.expect(route6.defintions[route6.keys[0]]()).to.equal(11);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(route6.args(route6.keys[0])).to.eql(['4', '10/s/d/h', 'e', 'f']);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(route6.args(route6.keys[1])).to.eql(['4', '10/s/d/h/e', 'f']);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(route6.args(route6.keys[2])).to.eql(['4/10/s/d/h', 'e', 'f']);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(route6.args(route6.keys[3])).to.eql(['4/10/s/d/h/e', 'f']);

        done();
    });

    it("should discover definitions from the root of the tree if key is provided as empty str (or undefined)", function (done) {
        // get routes corresponding to key
        const route7 = hasDefinition(routes, "", options);
        // expect 1 matches
        chai.expect(route7.keys.length).to.equal(1);
        // expect to only match on the full wildcard route
        chai.expect(route7.defintions[route7.keys[0]]()).to.equal(-1);
        // if we call to args with the matched key we can gather the matches details
        chai.expect(route7.args(route7.keys[0])).to.eql([""]);

        done();
    });

    it("should discover definitions against key where multiple wildcard positions would match", function (done) {
        // get routes corresponding to key
        const route8 = hasDefinition(routes, "4/10/s/d/h/e/f/a/c/d/e/f", options);
        // expecting 5 matches (* note that **/e/f/**/e/* matches first because it is longer and contains more details)
        chai.expect(route8.keys).to.eql(['**/e/f/**/e/*', '4/**/e/**', '4/**/f', '**/e/f', '**/f']);
        // expect to only match on the full wildcard route
        chai.expect(route8.defintions[route8.keys[0]]()).to.equal(9);
        // check the first - "**/e/f/**/e/*"
        chai.expect(route8.args(route8.keys[0])).to.eql([
            "4/10/s/d/h",
            "e",
            "f",
            "a/c/d",
            "e",
            "f"
        ]);
        // check the second - "4/**/e/**"
        chai.expect(route8.args(route8.keys[1])).to.eql([
            "4",
            "10/s/d/h",
            "e",
            "f/a/c/d/e/f",
        ]);
        // check the third - "4/**/f"
        chai.expect(route8.args(route8.keys[2])).to.eql([
            "4",
            "10/s/d/h/e/f/a/c/d/e",
            "f"
        ]);
        // check the fourth - "**/e/f"
        chai.expect(route8.args(route8.keys[3])).to.eql([
            "4/10/s/d/h/e/f/a/c/d",
            "e",
            "f"
        ]);
        // check the fifth - "**/f"
        chai.expect(route8.args(route8.keys[4])).to.eql([
            "4/10/s/d/h/e/f/a/c/d/e",
            "f"
        ]);

        done();
    });

    it("should discover definitions which match in only a limited situation", function (done) {
        // get routes corresponding to key (avoid e and f to just get the 4/**/d/a|b definiton)
        const route9 = hasDefinition(routes, "4/10/s/x/c/f/c/d/b", options);
        // expect 1 matches
        chai.expect(route9.keys.length).to.equal(1);
        // expect to only match on the full wildcard route
        chai.expect(route9.defintions[route9.keys[0]]()).to.equal(12);
        // check the match fits - "4/**/d/a|b"
        chai.expect(route9.args(route9.keys[0])).to.eql([
            "4",
            "10/s/x/c/f/c",
            "d",
            "b"
        ]);

        done();
    });

    it("should fail gracefully and return false on args if uri doesnt match any defintions", function (done) {
        // expect to miss if the URI doesnt fit available routes
        const route10 = hasDefinition(routes, "0/c", options);
        // expect 0 matches
        chai.expect(route10.keys.length).to.equal(0);
        // calling to args will always return false because no definitions match
        chai.expect(route10.args()).to.eql(false);

        done();
    });

});