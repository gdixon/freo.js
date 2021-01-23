// import all casting methods
import { castArray } from "./type/array.js";
import { castArrayBuffer } from "./type/arrayBuffer.js";
import { castBool } from "./type/bool.js";
import { castDate } from "./type/date.js";
import { castFloat } from "./type/float.js";
import { castInteger } from "./type/integer.js";
import { castObject } from "./type/object.js";
import { castString } from "./type/string.js";

// returns a named typeCasting method (or undefined)...
export const getType = function (type) {
    // if the type is a string that describes one of the following castings - return the method
    if (typeof type === "string") {
        // retrun the casting method for the given type
        switch (type.toLowerCase()) {
        case "array":
            return castArray;
        case "arraybuffer":
            return castArrayBuffer;
        case "bool":
            return castBool;
        case "date":
            return castDate;
        case "float": case "number":
            return castFloat;
        case "integer":
            return castInteger;
        case "object":
            return castObject;
        case "string":
            return castString;
        }
    }

    // return type as given to fail later
    return type;
};