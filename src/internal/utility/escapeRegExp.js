// apply escape char to special chars in text fed to regex
export const escapeRegExp = function (str, exceptions) {
    // mark special types
    const specials = ["-","[","]","{","}","(",")","*","+","!","<","=",":","?",".","\\/","\\\\","^","$","|","#",","];
    // drop any items present in the exceptions (duck typing for String/Array of exceptions)
    const intercept = (exceptions && exceptions.indexOf ? specials.filter((special) => exceptions.indexOf(special) == -1) : specials);

    // return the clean string
    return str.replace(new RegExp("[" + intercept.join("\\") + "]", "g"), "\\$&");
};