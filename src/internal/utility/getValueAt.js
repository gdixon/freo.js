// convert string keys to array of keys
import { toArray } from "./toArray.js";

// import valueAt method to get to the values contained
import { valueAt } from "./valueAt.js";

// set default meta object to record discovered values
import { prepareMeta } from "./prepareMeta.js";

// options:
// -- definition - mark the position of the definition being got
// -- asDefinition - mark that we're getting a type to disable the use of Arrays
// -- disableWildcard - disable the use of wildcards allowing * and ** to be set as properties on the response
// -- discovered - response object fed through options to allow grouping of reqs on the outside
// -- allMatches - get the value from all matches (this will allow hasSpecials uris to return matches that point to Object positions)

// get the value(s) from obj that match the key
export const getValueAt = function(obj, key, options) {
    // retrieve the full key as a clean array of key segments
    const keys = toArray(key);
    // recording details of the discovered keys (and their values):
    const discovered = prepareMeta("discovered", (options = options || {}));
    // extend options with get situation
    options = {
        // check for specials
        hasSpecials: (!options.disableWildcard && !options.asDefinition ? !!(key && key.match(/\*|\|/)) : false),
        // method to process the root node
        rootDiscover: (working, keyPrefix) => {
            // record the discovery
            discovered[keyPrefix] = working;

            // return the working position as root/response
            return working;
        },
        // method to call when a value is discovered (on a recursion path)
        recurseDiscover:(working, keyPrefix) => { 
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
        },
        // allow supplied options to overide
        ...options
    };
    // carry out the solution against the root of the obj and attempt to get all matching values
    valueAt(obj, keys, "", 0, options);

    // if any final leaf was set in the operation then return the newValue else return the original branch unaltered
    return (Object.hasOwnProperty.call(discovered, key || "") || !Object.keys(discovered).length ? discovered[key || ""] : discovered);
};