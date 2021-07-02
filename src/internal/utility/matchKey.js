// simple key matcher that operates on keys with special consideration for wildcards (*), greedys (**), options (a|a) and literals (a)

// - if a greedy is directly followed by any number of *'s or **'s they will be filled with a maximum of 1 value each ("a.b.c.d.e" ~ "**.**.**" == ['a.b.c','d','e'])
// - if a greedy is broken by a literal or an option the next greedy can start being greedy again (**.c|f.** == ['a.b', 'c', 'd.e']) 
// - if exactMatch is false then the key doesnt have to be an exact match, it can be either too long or too short, or partially wrong
// - if the key is partially wrong it must be from the right hand side ("a.b.c.d" ~ "a.b.c.e" == ['a','b','c',undefined])
// - any missing entries will be passed back in pos as undefined (the lhs must be defined for the rhs to be defined)
// - the responses length will always equal the defString.split(delimiter).length unless exactMatch is true and the key doesnt match

// -- this key parsing mechanism works equivalently to valueAt and hasDefinition but each works over a different source
// --- matchKey is working a string key against a uri key to discover arguments
// --- valueAt is working a source object against a uri key to discover values
// --- hasDefinition is working a definitions object against a uri key to discover matching definitions

// console.time("time");
// console.log(
//     matchKey("a.b.d.c.d.f.f.v", "a.b.d.**.*.**.d.s", {delimiter: "."}), // ["a", "b", "d", "c.d.f", "f", "v", undefined, undefined]
//     matchKey("a.b.d.c.d.f.d.s", "a.b.d.**.*.d.s"), // ["a", "b", "d", "c.d", "f", "d", "s"]
//     matchKey("a.b.d.c.d.f.d.s", "a.b.d.**.*.**.s"), // ["a", "b", "d", "c.d", "f", "d", "s"]
//     matchKey("a.b.d.c.d.f.d.d.d.s", "a.b.d.**.*.**.d.s"), // ["a", "b", "d", "c", "d", "f", "d", undefined]
//     matchKey("a.b.d.c.c.c.c.d.f.d.s", "a.b.d.**.d|e.**"), // ["a", "b", "d", "c.c.c.c", "d", "f.d.s"]
//     matchKey("a.b.d.c.d.f.z.z.z.z.d.s", "a.b.d.**.*.**.*.**.s"), //["a", "b", "d", "c.d.f.z", "z", "z", "z", "d", "s"]
//     matchKey("a.b.b.b.b", "a.**.**"), // ["a", "b.b.b", "b"]
// );
// console.timeEnd("time"); // ~0.9ms

// - options
// -- exactMatch
// -- forwardGreedyLookup
// -- delimiter

// work through a key and check for matches - return an array of each position that did match (allows for **, * and a|a)
export const matchKey = function (key, defString, options) {
    // construct options if ommited
    options = options || {};
    // default the delimiter
    options.delimiter = (options.delimiter ? options.delimiter : ".");
    // check for full match of the defString on key to avoid needing to do a thorough check on literal matching strings
    if (options.exactMatch && key === defString) {

        // establish array from keys
        return key.split(options.delimiter);
    } else if (!options.exactMatch && key.indexOf(defString) == 0) {

        // establish array from defString
        return defString.split(options.delimiter);
    } else {
        // pointer as we move through the segs and res were we place the keys on discovery
        let pos = 0, res = [];
        // pull the keys and the segs from the provided strings
        const keys = key.split(options.delimiter), segs = defString.split(options.delimiter);
        // check each segment individually
        while (pos < segs.length && keys.length) {
            // special case for greedy
            if (segs[pos] !== "**") {
                // if check didnt return false we can absorb the result (joining the inner collection)
                if (match(pos, keys, segs, true)) {
                    // shift the key which matches and incr the pos
                    res[pos++] = keys.shift();
                } else {
                    // cant match any more positions - stop the while and return result so far
                    pos = segs.length;
                }
            } else {
                // consume keys into the greedy position by discovering the next literal/options that matches or the end of keys
                pos = greedy(pos, keys, segs, res, options);
            }
        }
        // ensure the args follow expected length (should be the same length as the inputted defString)
        if ((options.exactMatch && (keys.length || res.length < segs.length)) || (!options.exactMatch && typeof res[0] == "undefined")) {

            // return an empty result
            return [];
        } else {
            // ensure short keys receive full length of defString
            if (!options.exactMatch && res.length < segs.length) {
                // place empties into the array to fill expected space
                res = [...res, ...new Array(segs.length - res.length)];
            }

            // return the discovered keys (always return an array)
            return res;
        }
    }
};

// check for a literal or options match in the keys (or for a wild (*) if matchWild is true)
const match = (pos, keys, segs, matchWild) => {
    // pull the nextSegment along
    const isWild = segs[pos] == "*";
    // check for match against options/literal
    if (!isWild) {
        // work through the options and mark discovery
        let discovered = false;
        // split the options into an array
        const opts = segs[pos].split("|");
        // stop on discovery
        while (discovered === false && opts.length) {
            // if any key matches mark discovered and stop checking
            if (keys[0] == opts.shift()) discovered = true;
        }

        // returns true/false
        return discovered;
    }

    // never match on ** or * if we're moving from a nested
    return (isWild && matchWild ? true : false);
};

// consume a greedy segment against the keys -- * note this isnt recursive - no forward lookaheads - just consuming
const greedy = (pos, keys, segs, res, options) => {
    // say for example were using a.b.c.d and **.*.* we want a.b, c, d
    let consumed = [], initialPos = pos, pass = false;
    // check if the next literal matches skipping wild checks because we've already consumed them (if theres specials inbetween then segments must be present on keys)
    pass = (pos+1 < segs.length && !((options.exactMatch || options.forwardGreedyLookup) && keys.length) ? match(pos+1, keys, segs) : false);
    // if the next node passes - move the pos along one position
    if (pass) {
        // incr the pos to fill from next position
        pos = pos+1;
    } else {
        // move through all the specials - if we match we incr the pos and consume the key from the front
        while (pos < segs.length - 1 && (segs[pos] == "*" || segs[pos] == "**") && pos++) {
            // consume this key -- we'll work out we're it lands when we match a literal or reach the end of key input
            consumed.push(keys.shift());
        }
        // check for matches beyond the greedy position (first option or literal - consume all that dont match)
        while (pass === false && keys.length) {
            // check if the next literal matches skipping wild checks because we've already consumed them
            pass = match(pos, keys, segs);
            // if it doesnt then knock the key into the buffer for greedy results
            if (!pass && keys.length) {
                // take note of this key and incr to the next
                consumed.push(keys.shift());
            }
            // now do a forward pass to make sure everything following this position matches (if exactMatch == false) 
            // - this should be used when you know the final key should match final segs and matches in the middle should be ignored
            if ((options.exactMatch || options.forwardGreedyLookup) && pass && keys.length) {
                // check if the rest of the string matches
                const matches = matchKey(keys.join(options.delimiter), segs.slice(pos, segs.length).join(options.delimiter), options);
                // if the match failed then consume the next key and try to match the rest again
                if (!matches.length || (options.forwardGreedyLookup && keys.length > segs.length-pos)) pass = false, consumed.push(keys.shift());
            }
        }
    }
    // check consumption
    if (consumed.length) {
        // consume n from consumed (if we're currently on a splat and there are more segs to go but no keys dont move back 1)
        const consumeUntil = (pos - initialPos) - (!keys.length && (segs[pos] == "**") ? 0 : 1);
        // push the splat collection to the initialPos response leaving enough keys to place 1 into each * or ** after the initial **
        while (consumed.length > consumeUntil) {
            // keep pushing into the res at initial position until the consumed length is equal to the number of specials left
            (res[initialPos] ? res[initialPos] : (res[initialPos] = [])).push(consumed.shift());
        }
        // join the res[initialPos] we just filled to create one delminated entry
        res[initialPos] = res[initialPos].join(options.delimiter);
        // spread the rest of the items out for each * or ** entry after the greedy
        consumed.forEach((v, key) => (res[initialPos + key + 1] = v));
    }
    // if the value passed...
    if (pass) {
        // place the discovered match after the greedys remainder spread
        res[initialPos + consumed.length + 1] = keys.shift();
    }

    // move to the position that needs to be filled next or end filling
    return (pass ? pos + 1 : segs.length);
};
