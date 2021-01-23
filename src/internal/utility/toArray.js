// convert string keys to array of keys
export const toArray = function (key, deliminator, skipSquares) {
    // check if the key needs to be converted
    if (!Array.isArray(key)) {
        // clean the key to just dot delim and [] markers (key must be a string)
        key = (typeof key !== "undefined" && key.toString ? key.toString() : "");
        // remove square brace markers (arr[style][access]) replacing the open with a deliminator
        if ((key || (key = "")) && !skipSquares) key = key.replace(/([^\[])\[/g, "$1" + (deliminator || ".")).replace(/^\[/g, "").replace(/\]/g, "");
        // split to single array of keys on delim and open squares
        key = key.split(deliminator || ".");
    }

    // return the key as an array of keys or an empty Array
    return key;
};