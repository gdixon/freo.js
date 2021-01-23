// given the name of a meta object and the options - return the meta object and optionally record into options
export const prepareMeta = function (name, options) {
    // check if the position is an array or not
    const isArray = Array.isArray(options[name]);
    // recording details to obj as key=>val pairs
    const meta = (!isArray && options[name] && options[name].constructor == Object ? options[name] : {});
    // collect each operation into its own definition (of key=>val pairs) so that the outside can co-ordinate transactions
    if (isArray) options[name].push(meta);

    // return the meta object for operations recording
    return meta;
};