// clone an object/value -- supports cloning Objects, Arrays, Dates, ArrayBuffers, Strings and Numbers/Floats/Intergars
export { clone } from "../internal/utility/clone.js";
// merge n* objects together into the left most object (recursively) - this will Object.assign Array entrants ([1,2] + [3,4] = [3,4])
export { merge } from "../internal/utility/merge.js";
// join n* objects together into the left most object (recursively) - this will concat Array entrants ([1,2] + [3,4] = [1,2,3,4])
export { join } from "../internal/utility/join.js";

// check if two values are equal by value
export { equal } from "../internal/utility/equal.js";

// check if a given value is either an Object or an Array (a primitive object - ie we can iterate its memeber)
export { isObject } from "../internal/utility/isObject.js";
// check if a given value is a constructor (ie we can create a new instance of it)
export { isConstructor } from "../internal/utility/isConstructor.js";

// escape any special chars before feeding through regExp
export { escapeRegExp } from "../internal/utility/escapeRegExp.js";

// string/array of keys to array of keys broken at deliminator
export { toArray } from "../internal/utility/toArray.js";

// check the validity of a key against a {wildcard} uri *note - both sides could be literal and the left can be longer/shorter (if returnMatches=true)
export { matchKey } from "../internal/utility/matchKey.js";

// check for a definition at a key location (this is the reverse logic of valueAt - it works backwards to find wildcard position from a literal key)
export { hasDefinition } from "../internal/utility/hasDefinition.js";

// prepareMeta constructs response objs (discovered, written, dropped) and places them into the options
export { prepareMeta } from "../internal/utility/prepareMeta.js";

// getValueAt and setValueAt call to valueAt to produce results 
export { valueAt } from "../internal/utility/valueAt.js";

// get a value from an object based a key (which can point to wildcard segments)
export { getValueAt } from "../internal/utility/getValueAt.js";
// set a value in an object based a key (which can point to wildcard segments)
export { setValueAt } from "../internal/utility/setValueAt.js";

// produce a Stream against an Observable and a key position (allowing for wildcards)
export { stream } from "../internal/utility/stream.js";

// getType packages the following types into a string based getter
export { getType } from "../internal/utility/getType.js";

// export all built in types to be used with typeAdapter (or to just be used - they cast the requested primitive type from given where appropriate)
export { array, castArray } from "../internal/utility/type/array.js";
export { object, castObject } from "../internal/utility/type/object.js";

export { bool, castBool } from "../internal/utility/type/bool.js";

export { string, castString } from "../internal/utility/type/string.js";

export { arrayBuffer, castArrayBuffer } from "../internal/utility/type/arrayBuffer.js";

export { date, castDate } from "../internal/utility/type/date.js";

export { float, castFloat } from "../internal/utility/type/float.js";
export { integer, castInteger } from "../internal/utility/type/integer.js";
