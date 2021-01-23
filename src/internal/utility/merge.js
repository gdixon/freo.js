// check if a value is a primitive Object/Array
import { isObject } from "./isObject.js";

// merge either needs to check to the final branch before immutable cloning or it needs to check for reference equality before merging

// export module to mergeObjects from the left to right
export const merge = function(...objs) {
    // check if the last node marks immutable
    const immutable = ((typeof objs[objs.length-1] !== "object") && !!(objs.pop()));

    // merge the provided objects by reducing over the values and merging at position (of right hand-side)
    return objs.reduce((carr, obj) => {
        // check the obj is defined and holds obj value
        if (obj && isObject(obj)) {
            // deep map the properties
            Object.keys(obj).forEach(key => {
                // concat to merge arrays and recurse to cast objects - prim vals are copied directly
                carr[key] = innerMerge(carr, key, carr[key], obj[key], immutable);
            });
        }

        // obj is equal by value to cVal with oVal patched over the top
        return carr;
    }, objs.slice(0, 1)[0]);
};

// inner section of the merge operation
const innerMerge = function(carr, key, left, right, immutable) {
    // shallow merge based on type - always stick with left hand sides type and merge in (to avoid losing any mutable references)
    if (left === right) {
        // if the references are equal we can simple return the left unaltered
        carr[key] = left;
    } else if (isObject(left) && isObject(right)) {
        // shallow and deep merges the children left to right (will merge arrays into objects and objects into arrays)
        carr[key] = merge(...[(immutable ? left.constructor() : false), left, right].filter((v) => v), immutable);
    } else {
        // straight through set the value from right into left
        carr[key] = right;
    }

    // return the merge result
    return carr[key];
};