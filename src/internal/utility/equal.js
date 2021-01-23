// check if a value is a primitive Object/Array
import { isObject } from "./isObject.js";

// check if two values/objects are of equal value
export const equal = function (x, y) {
    // check for direct equality on the given args
    if (x === y) {

        // if refs/values match then equal
        return true;
    } else if (x instanceof ArrayBuffer || y instanceof ArrayBuffer) {
        // if one is not an instanceof the other then they dont match
        if (!(x instanceof ArrayBuffer) || !(y instanceof ArrayBuffer)) return false;
        // if the byteLengths are different they cant match
        if (x.byteLength != y.byteLength) return false;
        // pull the values via a view
        const dv1 = new Int8Array(x);
        const dv2 = new Int8Array(y);
        // iterate the values and compare
        for (let i = 0 ; i != x.byteLength ; i++) if (dv1[i] != dv2[i]) return false;

        // if we havent returned false then the two arrayBuffers are equal
        return true;
    } else if (x instanceof Date || y instanceof Date) {
        // if one is not an instanceof the other then they dont match
        if (!(x instanceof Date) || !(y instanceof Date)) return false;
        // if the values reported by the Date instance are different they dont match
        if (x.toString() != y.toString()) return false;

        // if we havent returned false then the two Dates are equal
        return true;
    } else if (isObject(x) && isObject(y) && x.constructor === y.constructor) {
        // props on x match values of props on y
        for (const p in x) {
            // if x[p] is an object then y[p] must also be an object and all properties must be equal
            if (!y || typeof y[p] !== typeof x[p] || !equal(x[p], y[p])) return false;
        }
        // ensure all props on y are present on x (checking for new props)
        for (const p in y) if (typeof x[p] == "undefined") return false;

        // if we havent returned false then the two objects are equal
        return true;
    }

    // if we havent returned true then the given args are not equal
    return false;
};