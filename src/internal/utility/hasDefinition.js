// convert string keys to array of keys
import { toArray } from "./toArray.js";

// escape a string for use in regexp
import { escapeRegExp } from "./escapeRegExp.js";

// match a key against a definition and extract the matching arguments
import { matchKey } from "./matchKey.js";

// match positions from a trie-object based on key that allows for wildcards (*), greedy wildcards (**), option sets (a|b) and literals (a)
export const hasDefinition = function (obj, key, options) {
    // default the options to an empty obj if its ommited
    options = (options ? Object.assign({}, options) : {});
    // default to a type definition check
    options.definition = options.definition || "_type";
    // default to dot delimination
    options.deliminator = options.deliminator || ".";
    // collect matching recursion keys - remove them from keyPrefix if we recurse again - resetting each wildcard restart
    options.collected = options.collected || [];
    // default the working keyPrefix to empty string so we can build it up as we move through the keys
    let keyPrefix = (typeof options.keyPrefix !== "undefined" ? options.keyPrefix : "");
    // mutable collections of each position we accessed along the trie object
    const accessList = options.accessList || {};
    // keep track of all keys, weights and definitions discovered in this and subsequent recursions feeding back to parent
    const keys = [], weights = [], defintions = {};
    // if the key directly points at value...
    if (obj && (!key && obj[options.definition] && !keyPrefix)) {
        // default the working key
        keyPrefix = key;
        // assign a weight if absent
        if (typeof obj[options.definition].weight == "undefined") obj[options.definition].weight = constructWeight(keyPrefix, options);
        // record the position
        keys.push(keyPrefix);
        // record the weight from the type
        weights.push(obj[options.definition].weight);
        // record the access position
        accessList[keyPrefix] = obj;
        // record the definition as fn
        defintions[keyPrefix] = obj[options.definition].fn;
    } else if (obj && obj.constructor === Object && key) {
        // when the root of this attempt points to obj - retrieve the full requested key as an array
        const workingKey = toArray(key, options.deliminator);
        // iterate key collection moving to next position each turn
        while (typeof obj !== "undefined" && workingKey && workingKey.length > 0) {
            // if we're in recursion mode the next key must be given (not a wildcard)
            const checkWildcard = (!options.recursive && typeof workingKey[0] !== "undefined" && (typeof obj["*"] !== "undefined" || typeof obj["**"] !== "undefined" || typeof obj["***"] !== "undefined"));
            // when we encounter an array of collections against a str key we should match on nested properties
            if (options.recursive || checkWildcard) {
                // if we use Map we can use has and get only (because of IE)
                if (typeof obj["*"] !== "undefined") {
                    // recurse on the relevent element (key must be present at * position)
                    recurse(workingKey, obj, "*", keyPrefix, accessList, keys, weights, defintions, true, Object.assign({}, options));
                }
                // check if the defintions has a loose match present at nested position for key (closes gap between lhs and keys after the ** (** can cover any number of segments))
                if (typeof obj["**"] !== "undefined") {
                    // initiate a recursive check -- tracks the position from **
                    recurse(workingKey, obj, "**", keyPrefix, accessList, keys, weights, defintions, true, Object.assign({}, options));
                }
                // check if the defintions has a loose match present at nested position for key (closes gap between lhs and keys after the ** (** can cover any number of segments))
                if (typeof obj["***"] !== "undefined") {
                    // pull each of the defined options at this stage (stored as "a|b"=>_type)
                    Object.keys(obj["***"]).forEach((k) => {
                        // split the options and check if the next workingKey fits
                        if (k.split("|").indexOf(workingKey[0]) !== -1) {
                            // recurse on the relevent element (option must be present at workingKey position)
                            recurse(workingKey, obj["***"], k, keyPrefix, accessList, keys, weights, defintions, true, Object.assign({}, options));
                        }
                    });
                }
                // check if the recursion is valid (recurse when the property doesnt fit the entry)
                if (options.recursive) {
                    // clean the collected from the keyPrefix
                    if (options.collected.length && typeof obj[workingKey[0]] === "undefined") {
                        // remove the collected items from the keyPrefix on mismatch
                        keyPrefix = keyPrefix.replace(new RegExp(escapeRegExp(options.deliminator) + "?" + escapeRegExp(options.collected.join(options.deliminator)) + "$"), "");
                        // clear the collected items and start again on this recursion
                        options.collected = [];
                    }
                    // move along the same item - check to see if the key matches by shifting and ckecking again
                    recurse(workingKey, options.parent, options.parentKey, keyPrefix, accessList, keys, weights, defintions, false, Object.assign({}, options));
                }
            }
            // drop the k from workingKey for next iteration
            const k = workingKey.shift();
            // default the working key
            keyPrefix = keyPrefix.toString() + (keyPrefix.toString() ? options.deliminator : "") + k;
            // key matches single item at this position - move to it or undf on missing
            if (typeof obj[k] !== "undefined") {
                // move to that object
                obj = obj[k];
                // record the parents access position?
                accessList[keyPrefix] = obj;
                // keep record of collected entities since last reset (so we can clear on mis-match) 
                options.collected.push(k);
            } else {
                // key not present - mark current as undefined to stop working the key
                obj = undefined;
            }
        }
        // check for presents of type at key position
        if (typeof obj !== "undefined" && typeof obj[options.definition] !== "undefined" && keys.indexOf(keyPrefix) == -1 && workingKey.length == 0) {
            // assign a weight if absent - only need to weigh once - weight is constant
            if (typeof obj[options.definition].weight == "undefined") obj[options.definition].weight = constructWeight(keyPrefix, options);
            // record the final if it holds a value
            keys.push(keyPrefix);
            // record the defintions weight
            weights.push(obj[options.definition].weight);
            // final obj as type
            defintions[keyPrefix] = obj[options.definition].fn;
        }
    }

    // return the constructed response with requested parts
    return {
        // return the initial key as input
        input: key,
        // sort the keys by the weight (before sorting the weight so that positions are joined)
        keys: (!options.skipSort ? Object.keys(keys).sort((a, b) => sortByWeight(weights[a], weights[b])).reduce((carr, k) => (carr.push(keys[k]) && carr), []) : keys),
        // sort the weights with the same algorithm
        weights: (!options.skipSort ? weights.sort((a, b) => sortByWeight(a, b)) : weights),
        // return the defintions as a flat obj of matching keys
        defintions: defintions,
        // get arguments for the key entry - allow for entry to be skipped to avoid leaks if using an immutable definition structure
        ...(!options.skipArgs ? {
            // calling to args with a matching definition key (keys item) will retrive an array of matching elements corresponding to the input key
            args: (definitionKey) => {
                // check that the definition is present
                if (keys.indexOf(definitionKey) !== -1 && accessList[definitionKey] && accessList[definitionKey][options.definition]) {

                    // perform an exact match against the key that we're tied to and the provided definition
                    return matchKey((key && key.toString ? key.toString() : ""), definitionKey, {
                        // marking exact match forces forwardlookup on greedys and makes sure all props are set before return a match
                        exactMatch: true,
                        // pass through the assigned deliminator
                        deliminator: options.deliminator
                    });
                }

                // return false if any attempts are made which dont match expectation
                return false;
            }
        } : {})
    };
};

// recursively match against wildcarded entrants (** and *)
const recurse = function (workingKey, obj, key, keyPrefix, accessList, keys, weights, defintions, startNew, options) {
    // shallow copy of the arr so shift doesnt drop from original
    const arrKeys = workingKey.concat();
    // check if this and future calls should be treat as recursions
    const recursive = (options.recursive && !startNew);
    // we want to ignore the ** as a placeholding so { a.**.b } can match { a.b } - at all other times we want to move to the next key
    if (key !== "**" || recursive) arrKeys.shift();
    // attach to the prefix if required (whenever we're not recursing)
    if (!recursive) keyPrefix = keyPrefix + (keyPrefix ? options.deliminator : "") + key;
    // collect matches recursively from nested position in the defintion obj (this moves another branch deeper and runs the full check again)
    const response = hasDefinition(obj[key], arrKeys, {
        // feed the defintion attr through
        definition: options.definition,
        // feed the deliminator attr through
        deliminator: options.deliminator,
        // restore collected from last tick or start fresh
        collected: (!startNew ? options.collected.concat() : []),
        // mark the next layer as recursive
        recursive: (key == "**" || recursive),
        // skip the sorting and args supply operation till the end
        skipSort: true, skipArgs: true,
        // record everything that was accessed
        accessList: accessList,
        // record the parent that we entered from
        parent: obj,
        // and the associated key so we can re-enter at this position
        parentKey: key,
        // prefix the key to mark entry position
        keyPrefix: keyPrefix
    });
    // record this definition into accessed so that the args can access it (only relevent if this is the last position on the keys)
    if (arrKeys.length === 0) accessList[keyPrefix] = obj[key];
    // iterate the collection and store new entries only so as not to polute the collections
    response.keys.forEach((responseKey, k) => {
        // check if the entry has already been registered
        if (keys.indexOf(responseKey) == -1) {
            // retrieve and combine the returned values from the match into keys, parent, valueSet and obj
            keys.push(response.keys[k]);
            // retrieve the returned values from the match into keys, parent, valueSet and obj
            weights.push(response.weights[k]);
        }
    });
    // combine discovered defintions from the recursion response into the parents definitions - mutable merge left
    Object.assign(defintions, response.defintions);
};

// construct a weight to guide positioning - we want to match from left to right given precedence to values which more correctly fit the position
// - more descriptive keys should be given a lighter weight (a/a/a is more descriptive than */*/*) amongst same lengthed peers
// - a key becomes more positive the less descriptive it gets and the longer it gets 
// - literals are heavier than options which are heavier than wildcards 
// - weights should only be measured against keys of the same length (if no greedys are present)
// - the presents of a greedy negates and inverses the whole structure (so that the most descriptive becomes the largest negative)
// - greedy keys should always return a negative weight 
// - a greedy key becomes more negative the more descriptive it gets
// - weight can be checked against any other weight by sorting ASC and picking the smallest positive or the largest negative (when no positives present)
// - e.g. assume the result of hasDefinition (without sorting) for "a.a.a" gave us:
// -- [**, **.**.**, **.**.a, **.a.**, **.a.a, a.**.**, a.**.a, a.a.**, *.*.*, *.*.a, *.a.*, *.a.a, a.*.*, a.*.a, a.a.*, a.a.a]
// - with weights (and in order)...
// ~~ (
//  a.a.a = 18    ->  a.a.* = 21    ->  a.*.a = 26     ->  a.*.* = 29    ->  *.a.a = 33   ->  *.a.*  = 36    ->  *.*.a = 41      ->  *.*.* = 54
//  a.a.** = -78  ->  a.**.a = -66  ->  a.**.** = -58  ->  **.a.a = -50  -> **.a.** = -42 ->  **.**.a = -30  ->  **.**.** = -22  ->  ** = -1
// )
// - sorted using sortByWeight():
// == [a.a.a, a.a.*, a.*.a, a.*.*, *.a.a, *.a.*, *.*.a, *.*.*, a.a.**, a.**.a, a.**.**, **.a.a, **.a.**, **.**.a, **.**.**, **]
const constructWeight = function (key, options) {
    // could also go dumb and just do longest match?? most given parts wins?
    // produce an array of segments from the key
    const segments = toArray(key, (options && options.deliminator));
    // negate if entry contains a greedy wildcard (**) in any position - after completing the full weight calc as a pos
    const greedy = segments.indexOf("**") !== -1;
    // record segLen because we use it every val
    const segsLen = segments.length;
    // construct weight so that keys can be compared against each other for difficulty to match
    const weight = segments.reduce((weight, k, indx) => {
        // start all values at 0
        let segmentsWeight = 0, optionsWeight = 0, wildcardsWeight = 0, greedysWeight = 0;
        // check for presents of | marker
        const isOption = (k.indexOf("|") !== -1);
        // check for presence of the greedy marker (switchs the method around so that ** is now the lightest)
        if (!greedy) {
            // literal string weight is the smallest
            segmentsWeight = (!isOption && k !== "*" && k !== "**" ? segsLen * ((segsLen - indx)) : 0);
            // options are a whole segsLen deeper and add more weight the deeper they are
            optionsWeight = (isOption ? (segsLen + 1 + (segsLen - indx)) * ((segsLen - indx)) : 0);
            // wildcards a segsLen deeper than that and add more weight the deeper they are
            wildcardsWeight = (k == "*" ? (segsLen + 2 + (segsLen - indx)) * ((segsLen - indx)) : 0);
        } else {            
            // literals are the largest when negating because we want the easiest match to have the largest weight before plonking a '-' infront of it
            segmentsWeight =  (!isOption && k !== "*" && k !== "**" ? (((4 * segsLen) + (segsLen - indx)) * ((segsLen - indx))) : 0);
            // then options are a segLen lighter (after negating)
            optionsWeight = (isOption ? (((3 * segsLen) + (segsLen - indx)) * ((segsLen - indx))) : 0);
            // wilds are a segLen lighter than that (after negating)
            wildcardsWeight = (k == "*" ? (((2 * segsLen) + (segsLen - indx)) * ((segsLen - indx))) : 0);
            // greedys are the lightest but work from the indx position rather than the reverse index 
            // (so the the greedy position moves the weight deeper inversely to the other types (if ** on the left then expect heavier than ** on the right)
            greedysWeight =  (k == "**" ? ((segsLen + (indx)) * (segsLen - indx)) : 0);
        }

        // sum the weights (* note that only one of the bracketed values will be present)
        return weight + (segmentsWeight + optionsWeight + wildcardsWeight + greedysWeight);
    }, 0);

    // when greedy is present take the weight from 0
    return (greedy ? 0 - weight  : weight);
};

// sort the weights into logical challenge order so that 0 index matches the best and -1 is the worst
const sortByWeight = function (weightA, weightB) {
    // check how the items should be sorted against each other (positives sort ASC - negatives sorted ASC (after the positives))
    if (weightA < 0 && weightB > 0) {

        // negatives on A should sort B upwards (after all positives)
        return 1;
    } else if (weightB < 0 && weightA > 0) {

        // negatives on B should sort B downwards (after all positives)
        return -1;
    } else {

        // normal ASC sort - sorts positives and negatives in ASC in two distinct groups (0 -> 100 -> -100 -> -1)
        return weightA - weightB;
    }
};