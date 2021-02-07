// Adaptable registers Adapters before calling back
// - Adaptable accepts [parent, adapters, ready-state, and a callback to call after registering Adapters]
// - if ready!=false .register is called with provided callback on init (chained to parents .onReady if parent is a Preparable (duck-typed))
export { Adaptable } from "./internal/adaptable.js";

// Preparable extends Adaptable and enqueues functions via .onReady and empties the call-stack on .ready 
// - Preparable accepts [parent, adapters, ready-state and preparation step to call after registering Adapters]
// - if ready!=false .prepare (which calls the preparation step) is passed to .register as callback and calls .ready on completion (after parents .onReady)
export { Preparable } from "./internal/preparable.js";

// Readable is a Preparable instance with .get (for accessing nested properties of a target) and methods for retrieving the raw value(s)
// - Readable accepts [target, key, options]
// - Readable holds a target which is an instance of Readable or a Primitive value
// - exposes methods for retrieving the raw value at .raw(skipClone) and is stringifiable
export { Readable } from "./internal/readable.js";

// Writable is a Readable instance with set, delete and transaction to control the target state
// - Writable accepts [target, key, options]
// - exposes method for setting/deleting and working transaction on the target
// - Writable accepts options on a global and per operation basis for:
//   -- immutable - *note that if the root/parent is immutable a child cannot be mutable
//   -- replaceRoot - allows for mutability to be expressed differently on the root child (default is !!immutable)
//   -- merge - allow array values to be concatted on set
//   -- creationMaxDepth - allows for new values to be created upto a certain depth if they dont already exist
//   -- fullKey - overide the targetKey with given
//   -- error - pass in an error handler to call instead of tunnelling errors to Adapters
//   -- meta - additional messages to send with each message
export { Writable } from "./internal/writable.js";