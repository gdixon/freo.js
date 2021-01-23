// check if the given value is a primitive object
export const isObject = function (obj) {

    // check against the constructor ensuring ! null (true for Object or Array)
    return (!!obj && (obj.constructor === Object || obj.constructor === Array));
};