// import chai for testing
import chai from 'chai';

// test subject (reports the route of the raw value held against an instance (with a .raw method))
import { matchKey } from "../../src/internal/utility/matchKey.js";

// set-up spec testing feature-set
describe("matchKey ~ from ~ freo/utility", function () {

    it("should matchKeys() given a key and a uri", function (done) {
        // expect matches...
        chai.expect(matchKey("a.b", "a.a|b")).to.eql(["a", "b"]);
        chai.expect(matchKey("a.b", "a.*")).to.eql(["a", "b"]);
        chai.expect(matchKey("a.b", "a.**")).to.eql(["a", "b"]);
        chai.expect(matchKey("a.b", "a.b")).to.eql(["a", "b"]);
        // expect matches...
        chai.expect(matchKey("a.b", "a.a|b", { exactMatch: true })).to.eql(["a", "b"]);
        chai.expect(matchKey("a.b", "a.*", { exactMatch: true })).to.eql(["a", "b"]);
        chai.expect(matchKey("a.b", "a.**", { exactMatch: true })).to.eql(["a", "b"]);
        chai.expect(matchKey("a.b", "a.b", { exactMatch: true })).to.eql(["a", "b"]);
        // expect partial matchs...
        chai.expect(matchKey("a.c", "a.a|b")).to.eql(["a", undefined]);
        chai.expect(matchKey("a", "a.**")).to.eql(["a", undefined]);
        chai.expect(matchKey("a", "a.b")).to.eql(["a", undefined]);
        chai.expect(matchKey("a.c", "a.b")).to.eql(["a", undefined]);
        // overmatches are ommited from the result
        chai.expect(matchKey("a.b.b", "a.*")).to.eql(["a", "b"]);
        chai.expect(matchKey("a.b.b", "a.b")).to.eql(["a", "b"]);
        // expect mismatch...
        chai.expect(matchKey("a.c", "a.a|b", { exactMatch: true })).to.eql([]);
        chai.expect(matchKey("a.b.b", "a.*", { exactMatch: true })).to.eql([]);
        chai.expect(matchKey("a", "a.**", { exactMatch: true })).to.eql([]);
        chai.expect(matchKey("a", "a.b", { exactMatch: true })).to.eql([]);
        chai.expect(matchKey("a.c", "a.b", { exactMatch: true })).to.eql([]);
        chai.expect(matchKey("a.b.b", "a.b", { exactMatch: true })).to.eql([]);

        done();
    });

    it("should matchKeys() given a key and a uri that matches with a greedy placeholder", function (done) {
        // check greedy wildcard forward match
        chai.expect(matchKey("a.b.b.b.b", "a.**")).to.eql(["a", "b.b.b.b"]);
        chai.expect(matchKey("a.b.b.b.b", "a.**.**")).to.eql(["a", "b.b.b", "b"]);
        chai.expect(matchKey("a.b.b.c.b.b", "a.**.c.**")).to.eql(["a", "b.b", "c", "b.b"]);
        chai.expect(matchKey("a.b.b.d.b.b", "a.**.c.**")).to.eql(["a", "b.b.d.b.b", undefined, undefined]);

        done();
    });

    it("should matchKeys() given a key and a uri and a defined deliminator", function (done) {
        // with deliminator
        chai.expect(matchKey("a/b", "a/a|b", { deliminator: "/" })).to.eql(["a", "b"]);
        chai.expect(matchKey("a/b", "a/*", { deliminator: "/" })).to.eql(["a", "b"]);
        chai.expect(matchKey("a/b", "a/**", { deliminator: "/" })).to.eql(["a", "b"]);
        chai.expect(matchKey("a/b", "a/b", { deliminator: "/" })).to.eql(["a", "b"]);
        chai.expect(matchKey("a", "a/**", { deliminator: "/" })).to.eql(["a", undefined]);
        chai.expect(matchKey("a/b", "a/**/b", { deliminator: "/" })).to.eql(["a", undefined, "b"]);
            
        done();
    });

    it("should matchKeys() as literals if the deliminator doesnt match the keys deliminator", function (done) {
        // without deliminator
        chai.expect(matchKey("a/b", "a/a|b")).to.eql([]);
        chai.expect(matchKey("a/b", "a/*")).to.eql([]);
        chai.expect(matchKey("a/b", "a/**")).to.eql([]);
        // would match as a single literal
        chai.expect(matchKey("a/b", "a/b")).to.eql(["a/b"]);

        done();
    });

    it("should allow matches on greedy placeholders to be optional (if the next immediate segment matches)", function (done) {
        // console.log(matchKey("a/b/c/d/e/f/g", "a/b/**/c/**/f/**/*", { deliminator: "/" }));
        // any splat may be optional...
        chai.expect(matchKey("a/b/c/d/e/f/g", "a/b/**/c/**/f/**/g", { deliminator: "/" })).to.eql(["a", "b", undefined, "c", "d/e", "f", undefined, "g"]);
        chai.expect(matchKey("a/b/c/d/e/f/g", "a/b/**/c/**/f/**/*", { deliminator: "/" })).to.eql(["a", "b", undefined, "c", "d/e", "f", "g", undefined]);
        chai.expect(matchKey("a/b/c/d/e/f/g", "a/b/**/c/**/f/**/*/*", { deliminator: "/" })).to.eql(["a", "b", undefined, "c", "d/e", "f", "g", undefined, undefined]);
        chai.expect(matchKey("a/b/c/d/e/f/g", "a/b/**/c/**/f/**/g/*", { deliminator: "/" })).to.eql(["a", "b", undefined, "c", "d/e", "f", undefined, "g", undefined]);
        chai.expect(matchKey("a/b/c/d/e/f/g", "a/b/**/c/**/f/**/**/*", { deliminator: "/" })).to.eql(["a", "b", undefined, "c", "d/e", "f", "g", undefined, undefined]);
        // we might change this behaviour later to absorb all the splats before a literal next match which would give us ["a", "b", undefined, "c", "d/e", "f", undefined, undefined, "g", undefined]
        chai.expect(matchKey("a/b/c/d/e/f/g", "a/b/**/c/**/f/**/**/g/*", { deliminator: "/" })).to.eql(["a", "b", undefined, "c", "d/e", "f", "g", undefined, undefined, undefined]);
    
        done();
    });

    it("should allow for greedys to defer matching on first next match if we know a later entry will match better...", function (done) {
        // without checking for an exactMatch we would stop feeding the greedy on the first "f"
        chai.expect(matchKey("4/10/s/d/h/e/f/a/c/d/e/f", "4/**/f", {deliminator: "/"})).to.eql(["4", "10/s/d/h/e", "f"]);
        // checking for an exactMatch should forward that first f match for later
        chai.expect(matchKey("4/10/s/d/h/e/f/a/c/d/e/f", "4/**/f", {exactMatch: true, deliminator: "/"})).to.eql(["4", "10/s/d/h/e/f/a/c/d/e", "f"]);
        // however if we do that and no "f" is present later - everything is absorbed to the greedy and we end up with an undf and not an exactMatch...
        chai.expect(matchKey("4/10/s/d/h/e/f/a/c/d/e/h", "4/**/f", {exactMatch: true, deliminator: "/"})).to.eql([]);
        // we can also do the same using forwardGreedyLookup...
        chai.expect(matchKey("4/10/s/d/h/e/f/a/c/d/e/f", "4/**/f", {forwardGreedyLookup: true, deliminator: "/"})).to.eql(["4", "10/s/d/h/e/f/a/c/d/e", "f"]);
        // the difference is that if the match fails later it will still return the positions that lead us here (with everything else on the last greey)
        chai.expect(matchKey("4/10/s/d/h/e/f/a/c/d/e/h", "4/**/f", {forwardGreedyLookup: true, deliminator: "/"})).to.eql(["4", "10/s/d/h/e/f/a/c/d/e/h", undefined]);

        done();
    });

});