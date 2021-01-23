// convert string keys to array of keys
import { toArray } from "./toArray.js";

// check if a value is a primitive Object/Array
import { isObject } from "./isObject.js";

// allow for immutable copying of objects via merge
import { merge } from "./merge.js";

// check that the final leaf is altered before carrying out set
import { equal } from "./equal.js";

// check the types defintion for most appropriate type for the given key (will match with arr index missing)
import { hasDefinition } from "./hasDefinition.js";

// import valueAt method to get to the values contained
import { valueAt } from "./valueAt.js";

// set default meta object to record discovered values
import { prepareMeta } from "./prepareMeta.js";

// options:
// -- immutable - if true, every item we access to reach the final node is shallow copied
// -- merge - if true, the new values being set are merged into the original obj (if immutable we still return a new obj, but with the original values included)
// -- types - types represented in a tree associated with key positions in obj (fed to hasType along with the full-key of the position being written)
// -- typesafe - use the types to lock type safety
// -- definition - mark the position of the definition being set
// -- asDefinition - mark that we're setting a type to disable the use of Arrays and to report errors considerately
// -- disableWildcard - disable the use of wildcards allowing * and ** to be set as properties on the response
// -- creationMaxDepth - set how deep new entries should be written if the source doesnt match key expectations (*note - not valid for wildcard entrants)
// -- written - record the final branches that were set in the operation (mutable collection fed by reference (impure))
// -- dropped - record the old value of each branch we replace (mutable collection fed by reference (impure))
// -- error - catch errors with a handler (all errors are caught and wont interupt the rest of the operation)
// -- allMatches - set the value against all matches (if were setting a wildcard entry with multiple matches along the same path the earliest will be set to the value)

// set value(s) in obj that match the key
export const setValueAt = function(obj, key, value, options) {
    // mark values as set (when theyre set)
    let valuesSet = false;
    // retrieve the full key as a clean array of key segments
    const keys = toArray(key);
    // recording details of written and dropped keys:
    // - we only have access to these as complete sets if we feed them as part of the options provided to setValueAt()
    // - record all values that are going out of context
    const dropped = prepareMeta("dropped", (options = options || {}));
    // - record all values being set on final branch(es) (ie all entries should hold the given value)
    const written = prepareMeta("written", options);
    // extend the options with set situation
    options = {
        // check for specials
        hasSpecials: (!options.disableWildcard && !options.asDefinition ? !!(key && key.match(/\*|\|/)) : false),
        // default the creation maxDepth and allow it to be reassigned in this context
        creationMaxDepth: (typeof options.creationMaxDepth === "undefined" ? 1 : options.creationMaxDepth),
        // record discovery from root node
        rootDiscover: function(working, keyPrefix, options) {
            // assign to response
            let response = undefined;
            // record the new state
            if (!options.immutable && isObject(working) && isObject(value) && Array.isArray(working) === Array.isArray(value)) {
                // insert all values from the new value - defaulting to empty constuctor if no value is given - immutable roots need merging even if merge was false
                response = recordSetValue(working, keyPrefix, value, dropped, written, Object.assign({}, options, { merge: true }), !options.merge, () => (valuesSet = true));
            } else {
                // clear the values from the original target (so that we can set the properties from the response on a clean slate but mutable)
                const clearSource = (!options.merge && !options.immutable && isObject(working) && (typeof value === "undefined" || value === null));
                // if we're at the end with any empty key then typeCheck the value and return as response
                response = recordSetValue(working, keyPrefix, value, dropped, written, options, clearSource, () => (valuesSet = true));
            }
    
            // return the response;
            return response;
        },
        // method to call when a value is discovered (on a recursion path)
        recurseDiscover: (working, keyPrefix, options) => { 

            // set the value from this position if we're at the end of the keys
            return recordSetValue(working, keyPrefix, value, dropped, written, options, false, () => (valuesSet = true));
        },
        // process the nested discovery
        nestedDiscover: function(working, keyPrefix, childKey, options) {
            // check if this property should be written according to creationMaxDepth (0 == if it currently exists then write to it)
            if ((options.creationMaxDepth == 0 && Object.prototype.hasOwnProperty.call(working, childKey)) || options.creationMaxDepth > 0 || options.creationMaxDepth == -1) {
                // set the value at final position and merge into the current collection
                working[childKey] = recordSetValue(working[childKey], keyPrefix + (keyPrefix ? "." : "") + childKey, value, dropped, written, options, false, () => (valuesSet = true));
            }
        },
        // action to take if there are still keys left in the working set when we discover a matching key (if creation is allowed then we will write the next intermediary object)
        nestedFailCase: function(working, keyPrefix, childKey, keys, options) {
            // reference the current child
            const wrk = working[childKey];
            // if the key represents an option-set we need to make sure the key we type check against is just one of the keys
            const check = keys[0].split("|")[0];
            // get the next objects type to make sure key fits (asDefinition disables all lists ([]) and disableWildCard just disables wildcard lists)
            const nextsType = (options.asDefinition || (isNaN(check) && !options.disableWildcard) ? {} : []);
            // check for the wrong type (should either be an Object or an Array) -- if we're merging we dont mind merging into the original
            const wrongType = (!wrk || (!(options.merge && isObject(wrk)) && wrk.constructor !== nextsType.constructor));
            // check if we need to insert an intermediary -- this should only be handled upto the creationMaxDepth
            if (!options.hasSpecials && (wrongType) && keys.length && (options.creationMaxDepth == -1 || (options.creationMaxDepth > 0 && (--options.creationMaxDepth) >= keys.length - 1))) {
                // record the original value as a shallow clone so that the values can be restored later
                if (typeof dropped[keyPrefix + (keyPrefix ? "." : "") + childKey] == "undefined") dropped[keyPrefix + (keyPrefix ? "." : "") + childKey] = (isObject(wrk) ? merge(wrk.constructor(), wrk) : wrk);
                // produce obj/array for values to fill
                working[childKey] = nextsType;
            }
        },
        // absord the childValue returned by recurse
        absorbChild: (working, child, parent, parentKey, obj, response, options) => {
            // check if we're at the root?
            if (working === obj) {
                // set the array result as the response
                response = (options.immutable ? child : merge(obj, child));
            } else {
                // set the items back into the parent position as (im)mutabley resolved children
                parent[parentKey] = (options.immutable ? child : merge(parent[parentKey], child));
            }
    
            // return both working and response incase response has moved
            return { working: working, response: response };
        },
        // options recurse with full option set just need to run absorb here afterwards
        absorbOptions: (working, child, parent, parentKey, obj, response, options) => {
            // check if we're at the root?
            if (working === obj) {
                // when immutable - copy the current branch so the original structure is unchanged
                response = working = (options.immutable ? merge(child.constructor(), child) : child);
            } else {
                // when mutable - keep the current working reference so that we can alter it by reference
                parent[parentKey] = working = (options.immutable ? merge(child.constructor(), child) : child);
            }
    
            // return both working and response incase response has moved
            return { working: working, response: response };
        },
        // place the root item
        absorbRoot: function(working, parent, parentKey, obj, response, options) {
            // construct the response (root of the given obj) or working position - when working immutable we need to shallow clone the branch before committing to any work
            if (working === obj) {
                // when immutable - copy the current branch so the original structure is unchanged
                response = working = (options.immutable ? merge(working.constructor(), working) : working);
            } else {
                // when mutable - keep the current working reference so that we can alter it by reference
                parent[parentKey] = working = (options.immutable ? merge(working.constructor(), working) : working);
            }
    
            // return both working and response incase response has moved
            return { working: working, response: response };
        },
        // allow options to overide methods
        ...options
    };

    // carry out the solution against the root of the obj and attempt to replace the value at final position of key
    const newValue = valueAt(obj, keys, "", 0, options);

    // if any final leaf was set in the operation then return the newValue else return the original branch unaltered
    return (valuesSet ? newValue : obj);
};

// write value to the working object
const recordSetValue = function (working, key, value, dropped, written, options, clearSource, markSetValue) {
    // record the value that would be dropped if this write is successful (useful to still record so that undo/redo can do the same check again)
    if (typeof dropped[key] == "undefined") dropped[key] = (isObject(working) ? merge(working.constructor(), working) : working);
    // if we're at the end with any empty key then typeCheck the value and return as response
    const typed = typeCheckValue(key, value, written, options);
    // only record the value if working is different from typed - this allows us to return the original branch (in immutable calls) if nothing changes
    if (!equal(working, typed)) {
        // clear out the original values on the target before setting new values for mutable writes to undf/empty
        if (clearSource) Object.keys(working).forEach((key) => delete working[key]);
        // merge the typed value into the current collection
        const response = mergeCheckValue(working, typed, options);
        // record the value that was set
        written[key] = response;
        // mark values set in the options so we know to return the new branch
        markSetValue();

        // return the written value;
        return response;
    }
    
    // return original
    return working;
};

// typeCast the value we're setting (aswell as that values properties to ensure everything is typeSafe)
const typeCheckValue = function (key, value, written, options) {
    // extract if provided as freo instance (via TypeAdapter)
    const types = (options.types && options.types._root === options.types ? options.types.raw(true) : options.types);
    // return the casting method from single cast types
    const typeCastDefinition = (options.asDefinition && types && types._type && types._type.fn);
    // pick up the associated type (hasDefinition works like a router matching delim keys to defintiions in the given obj (defaults to _types definition))
    const cast = (options.typesafe ? (typeCastDefinition ? true : hasDefinition(types, key)) : false);
    // console.log(options.written, options.dropped, Object.keys(options.dropped).length);
    // when we can cast (found matching typeCast methods - if we discovered multiple we only need to use the first - the results are ordered)
    if (cast && (typeCastDefinition || cast.keys.length > 0) && !Object.hasOwnProperty.call(written, key)) {
        // if we have a castingMathod but cant cast the value will be set to undefined
        let casted = undefined;
        // construct error details
        const details = {key: key, method: "setValueAt", ...(options.skipMessage ? {
            // allow skip message to bubble into the error handler
            skipMessage: options.skipMessage
        } : {})};
        // check if the error being thrown is from a type setting opetation
        const asType = (options.asDefinition && value && value[options.definition]);
        // mark the value of the attempted set operation
        const attempted = (asType ? JSON.stringify(value[options.definition].fn) : JSON.stringify(value));
        // attempt to typeCast the provided value using assigned method
        try {
            // cast the value using the given type method (first in list of matching types)
            casted = (typeCastDefinition || cast.defintions[cast.keys[0]])(value);
            // if the casting didnt throw then check that the value was cast correctly - if undefined was returned then record a TypeError
            if (typeof casted == "undefined" && typeof options.error == "function") {
                // construct a typeError describing the issue
                const err = new TypeError(key + (asType ? "." + options.definition : "") + " cannot be set to " + attempted);
                // throw through the given error handler
                options.error(err, {err: err, value: attempted, type: typeCastDefinition || cast && cast.keys && cast.defintions[cast.keys[0]], ...details});
            }
        } catch (err) {
            // throw the error through to the assigned handler
            if (typeof options.error == "function") options.error(err, {err: err, value: attempted, type: typeCastDefinition || cast && cast.keys && cast.defintions[cast.keys[0]], ...details});
        } finally {
            // always move to the casted value (even undefined)
            value = casted;
        }
    }
    // recursively check each part of the item being set (but only Objects and Arrays nothing else that extends object and only when we're not working a single type)
    if (options.typesafe && !typeCastDefinition && isObject(value) && !options.asDefinition) {

        // copy the obj (because its the value being set and we might set it n times) and type check its content
        return Object.keys(value).reduce((carr, k) => {
            // recursively check the subpositions being set in this operation
            carr[k] = typeCheckValue(key + (key ? "." : "") + k, value[k], written, options);

            // return the recursive shallow clone of obj
            return carr;
        }, value.constructor());
    }

    // return the type checked value - shallow clone so that its not pointing to the same instance we passed in
    return (isObject(value) && !options.asDefinition ? merge(value.constructor(), value) : value);
};

// merge the right into the left if the options contains .merge === true
const mergeCheckValue = function (left, right, options) {
    // place the (recursively) typed value into the current collection
    if (options.merge === true && isObject(left) && isObject(right)) {
        // construct the merge operation - if immutable, merge to an empty instance of the typed Object/Array else merge in to the left
        const subjects = [
            // if the operation is immutable merge against a new Object/Array following initial object (the lefts) type
            (options.immutable ? left.constructor() : false),
            // merge the old values first
            left,
            // overwrite with new values
            right
        ].filter(v => v);

        // merge into {*a nest of shallow clones of} the working obj (*if immutable)
        return merge(...subjects, options.immutable);
    }

    // return the right unmerged
    return right;
};
