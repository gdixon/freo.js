// check if a value is a primitive Object/Array
import { isObject } from "./isObject.js";

// options:

// - rootDiscover - records/set a discovery from root with a method
// - recurseDiscover - records/set a discovery from a wildcard position with a method
// - nestedDiscover - records/set a discovery from literal/options with a method (if valid)
// - nestedFailCase - under sets create the next position along if appropriate (creationMaxDepth et al)
// - absorbRoot - absorb the root set into the working pointer
// - absorbChild - absorb the child into the working pointer
// - absorbOptions - absorb an option set into the working pointer
// - asDefinition - mark that we're setting a type to disable the use of Arrays and to report errors considerately
// - disableWildcard - disable the use of wildcards allowing * and ** to be set as properties on the response
// - allMatches - set the value against all matches (if were setting a wildcard entry with multiple matches along the same path the earliest will be set to the value)

// recursively set the value into position by navigating the key (looking for matches)
export const valueAt = function (obj, key, keyPrefix, depth, options, recursive, gettingOption) {
    // construct vars to hold option supplied methods
    let rootDiscover, recurseDiscover, nestedDiscover, nestedFailCase, absorbRoot, absorbChild, absorbOptions;
    // start dropping keys
    let response = undefined, childKey = null, parent = null, parentKey = null, working = obj;
    // shallow copy of the keys so that we dont disrupt the callers keys array
    const keys = (key && key.constructor == Array ? key.concat() : [""]);
    // assing methods from options to local state
    ({rootDiscover, recurseDiscover, nestedDiscover, nestedFailCase, absorbRoot, absorbChild, absorbOptions} = (options = (options || {})));
    // move the working object through the keys to land on final position (this will recurse if the key contains wilcard segments)
    while (keys.length && typeof (childKey = keys.splice(0, 1)[0]) !== "undefined") {
        // keep tracking the child and immutability set the value in a new clone of the branch
        if (childKey.toString() && isObject(working)) {
            // get recursion key (which might be the next key)
            const recurseKey = (childKey === "**" ? keys[0] : childKey);
            // check if the childKey might point to a set of options (a|b|c)
            const checkOptions = (!options.disableOptions && !gettingOption && (childKey.indexOf("|") !== -1 || (recursive && recurseKey && recurseKey.indexOf("|") !== -1)));
            // check for recursion match...
            const checkRecursive = (recursive && (working[recurseKey] == null || typeof working[recurseKey] === "undefined") && (Object.keys(working).length || keys.length));
            // if we're in recursion mode the next key must be given (not a wildcard)
            const checkWildcard = (!recursive && !options.asDefinition && !options.disableWildcard && (childKey === "*" || childKey === "**"));
            // work through arrays and collect matches recusively
            if (processOptions && checkOptions) {
                // drop the first key if we're in recursion
                if (childKey === "**") keys.shift();
                // continue recursing
                if (processWildcard && recursive && Object.keys(working).length) {
                    // process the wildCard operation (operation needs all params for recursion)
                    const child = processWildcard(working, "**", [recurseKey, ...keys], keyPrefix, depth, recurseDiscover, options);
                    // absorb the child
                    if (absorbChild) ({working, response} = absorbChild(working, child, parent, parentKey, obj, response, options));
                }
                // process the child (this will record all the appropriate dropped and written entries and return working with values set)
                const child = processOptions(working, recurseKey, keys, keyPrefix, depth, options);
                // absord the options into the response
                if (absorbOptions) ({working, response} = absorbOptions(working, child, parent, parentKey, obj, response, options));
                // above fully satisfys call - stop processing
                keys.length = 0;
            } else if (processWildcard && (checkRecursive || checkWildcard)) {
                // process the wildCard operation (operation needs all params for recursion)
                const child = processWildcard(working, childKey, keys, keyPrefix, depth, recurseDiscover, options, recursive);
                // absorb the child (either the response and working will be altered or only the working (in a set)) 
                if (absorbChild) ({working, response} = absorbChild(working, child, parent, parentKey, obj, response, options));
                // clear keys and stop working on this layers solution
                keys.length = 0;
            } else {
                // check if we're at the end or not...
                if (processWildcard && recursive && keys.length && Object.keys(working).length) {
                    // process the wildCard operation (operation needs all params for recursion)
                    const child = processWildcard(working, "**", keys, keyPrefix, depth, recurseDiscover, options);
                    // absorb the child
                    if (absorbChild) ({working, response} = absorbChild(working, child, parent, parentKey, obj, response, options));
                    // clear recursion and continue
                    recursive = false;
                } else {
                    // absorb the root first
                    if (absorbRoot) ({working, response} = absorbRoot(working, parent, parentKey, obj, response, options));
                    // move along the childKey // not sure we need this??
                    // childKey = (recursive ? (childKey = keys.shift()) : childKey);
                    // if we're getting/setting to a special - we should only be working on the final leafs of the values (unless indicated otherwise)
                    if (processNestedKey && (!options.hasSpecials || options.allMatches || (options.hasSpecials && !isObject(working[childKey])))) {
                        // process object position and record new value for creationMaxDepth (if absent/replaceable/end of key node is being written)
                        options = processNestedKey(working, childKey, keys, keyPrefix, nestedDiscover, nestedFailCase, {...options});
                    }
                    // increment the depth
                    depth++;
                    // set the parent position to the current position before moving on to the next
                    parent = working; parentKey = childKey;
                    // update keyPrefix for next cycle
                    keyPrefix = (keyPrefix + (keyPrefix ? "." : "") + childKey);
                    // move the working pointer
                    working = working[childKey];
                }
            }
        } else if (rootDiscover && !keys.length && !childKey.toString()) {
            // process the root node into discovered
            response = rootDiscover(working, childKey, {...options});
        }
    }

    // return the root obj that we entered the solution on
    return response;
};

// process the options by calling out to setValue at the corrected position
const processOptions = function(working, childKey, keys, keyPrefix, depth, options) {
    // if were asDefinition then we need to settle the options into a seperate obj marked by "***"
    if (options.asDefinition) {
        // ensure options record exists (all options are stored against a *** key to distinguish them)
        working["***"] = (working["***"] || {});
        // store the options at a nested position
        working["***"] = valueAt(working["***"], [childKey, ...keys], keyPrefix, depth+1, options, false, true);
    } else {
        // process the options as individual sets
        childKey.split("|").forEach((child) => {
            // carry out the setValue mechanism for each of the listed options (if immutable will move to shallow copy each turn)
            const got = valueAt(working, [child, ...keys], keyPrefix, depth+1, options);
            working = (got ? got : working);
        });
    }

    // return the working position without moving (mutable engagement)
    return working;
};

// proccess recursive calls to setValue - * note that this is extremely expensive over large collections ** works against every prop at every level * works at one level
const processWildcard = function (working, childKey, keys, keyPrefix, depth, recurseDiscover, options, recursive) {
    // check if the working point is an Array
    const workingIsArray = (working.constructor === Array);
    // check if the next item should be recursive //(!options.asDefinition && !options.disableWildcard ? 
    const nextIsRecursive = (childKey === "**" || recursive);
    // recursively solve the array definition
    const response = (workingIsArray ? working : Object.keys(working)).reduce((values, item, key) => {
        // correct the source of the item
        if (!workingIsArray) key = item; item = working[key];
        // return the item value to position on the outside (as fallback)
        values[key] = item;
        // need to know the distance the *.*'s describe so as not to register early - each descendent should register against their own states
        options = {...options};
        // check for recursion reset
        if (childKey === "**" && !recursive) {
            // no splats after keyPrefix yet
            options.splatFor = 0;
            // mark keyPrefix start position
            options.splatFrom = depth+1;
        }
        // next key we're discovering
        const discover = keyPrefix + (keyPrefix ? "." : "") + key;
        // how do we measure how many *'s since opening splat?
        if (childKey === "**") {
            // check if the key is discovered at this position
            const isMatch = (!keys.length || (keys.length == 1 && (keys[0] == key || keys[0] == "**")));
            // only setting to values that already hold value
            if (recurseDiscover && (options.splatFrom + options.splatFor) <= depth+1 && isMatch && typeof item !== "undefined" && !isObject(item)) {
                // run through the discovered method
                values[key] = recurseDiscover(item, discover, options);
            }
        } else if (recurseDiscover && childKey === "*" && keys.length == 0) {
            // allow the values to be gathered at this key location as discoveries (we dont mind if they're objects)
            values[key] = recurseDiscover(item, discover, options);
        }
        // check if there are more descendents...
        if (isObject(item) && (keys.length || childKey == "**")) {
            // drop the marking key from second key pos - if we've entered recursive the next doesnt need to be - but it does space the position
            if ((recursive && (keys[0] == "**" || keys[0] == "*"))) keys.shift(), options.splatFor++;
            // returns matching item (possibly cloned)
            values[key] = valueAt(item, (childKey === "**" ? [childKey, ...keys] : [...keys]), discover, depth+1, options, nextIsRecursive);
        }

        // return values with same type
        return values;
    }, working.constructor()); // always a shallow clone - make sure atleast a ref for the item is passed back in

    // return the response;
    return response;
};

// process the assignment at nested position (where working is a descendant of the root)
const processNestedKey = function (working, childKey, keys, keyPrefix, nestedDiscover, nestedFailCase, options) {
    // take a copy of the options
    options = {...options};
    // if we're at the end then set the value (via any typeCast method if present)
    if (nestedDiscover && keys.length === 0) {
        // set the value at final position and merge into the current collection
        nestedDiscover(working, keyPrefix, childKey, options);
    } else {
        // failover (under set this will attempt to construct missing entries)
        if (nestedFailCase) nestedFailCase(working, keyPrefix, childKey, keys, options);
    }

    // return the options incase of changes
    return options;
};