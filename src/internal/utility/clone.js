// export module to deep clone by cloning on constructor type and copying props recursively
export const clone = function (o) {

    // return a deep clone of the given target object (mapping clones of raw array values and reducing clones of object values to new objects)
    return (typeof o === "object" && o !== null ?
        // clone the object - we only need arrays and objects (date or {}) to be cloned - cloning ArrayBuffers so that old values can be g/c
        (o instanceof ArrayBuffer ? cloneArrayBuffer(o) : (Array.isArray(o) ? cloneArray(o) : cloneObject(o))) : o
    );
};

// not sure how likely we are to need to detect this -- ArrayBuffers are un
export const cloneArrayBuffer = function (o) {
    // create a new view over the buffer
    var values = new Uint8Array(o);
    // construct a new buffer of the same length
    var clone = new ArrayBuffer(o.byteLength);
    // set new view against the arrayBuffer
    var cloneArray = new Uint8Array(clone);
    // fill the buffer with values
    for (var i = 0; i < cloneArray.byteLength; i++) cloneArray[i] = values[i];

    // return the cloned buffer
    return clone;
};

export const cloneArray = function (o) {

    // return a clone of each item in the array
    return o.map(e => clone(e));
};

export const cloneObject = function (o) {
    // get the instance type as close as possible (this shouldnt be getting called with anything other than date/JSON objects)
    const type = new o.constructor((o instanceof Date ? o : undefined));

    // return a copy of the objects properties
    return Object.keys(o).reduce((r, k) => {
        // clone the objects property
        r[k] = clone(o[k]);

        // return the dest obj
        return r;
    }, type);
};
