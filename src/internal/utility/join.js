// check if a value is a primitive Object/Array
import { isObject } from "./isObject.js";

// export module to joinObjects from the left to right
export const join = function(...objs) {
    // check if the last node marks immutable
    const immutable = ((typeof objs[objs.length-1] !== "object") && !!(objs.pop()));

    // join the provided objects by producing a new set of unique entries
    return objs.reduce((carr, obj) => {
        // check if the position is an Array
        if (carr.constructor === Array) {
            // construct an array from the given object
            const asArray = (obj && obj.constructor === Array ? obj : (obj ? 
                // convert all object properties to entries in the array (lose the keys -- this is like concat(Array.values()))
                Object.keys(obj).reduce((ret, key) => (ret.push(obj[key]), ret), []) : []
            ));
            // create a set so we dont add duplicates to the Array
            const set = [...new Set([...carr, ...asArray])];
            // if we're not working immutable push into the carr position
            if (!immutable) {
                // drop the original collection
                carr.splice(0, carr.length);
                // push the members of the array
                carr.push(...set);
            } else {
                // replace carr with set (set is an immutable copy)
                carr = set;
            }
        } else if (obj && isObject(obj)) {
            // deep map the properties
            Object.keys(obj).forEach(key => {
                // concat to join arrays and recurse to cast objects - prim vals are copied directly
                carr[key] = innerJoin(carr, key, carr[key], obj[key], immutable);
            });
        }

        // obj is equal by value to cVal with oVal patched over the top
        return carr;
    }, objs.slice(0, 1)[0]);
};

// inner section of the join operation
const innerJoin = function(carr, key, left, right, immutable) {
    // shallow join based on type - always stick with left hand sides type and join left (to avoid losing any mutable references)
    if (left === right) {
        // if the references are equal we can simple return the left unaltered
        carr[key] = left;
    } else if (isObject(left) && isObject(right)) {
        // shallow and deep joins the children left to right (will join arrays into objects and objects into arrays)
        carr[key] = join(...[(immutable ? left.constructor() : false), left, right].filter((v) => v), immutable);
    } else {
        // straight through set the value from right into left
        carr[key] = right;
    }

    // return the join result
    return carr[key];
};