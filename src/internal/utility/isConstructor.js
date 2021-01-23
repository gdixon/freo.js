// check if the given value is a primitive constructor
export const isConstructor = function(obj) {
    
    // check for prototype chain
    return (!!obj && !!obj.prototype && !!obj.prototype.constructor.name);
};