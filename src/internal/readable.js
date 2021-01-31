// allow for this Base instance to be prepared (with onReady and ready)
import { Preparable } from "./preparable.js";

// take object and return a deep clone
import { clone } from "./utility/clone.js";

// deep shallow merge left on provided ...args using concat to place new items
import { join } from "./utility/join.js";

// retrieve an array of details given a key
import { toArray } from "./utility/toArray.js";

// get value at specific key
import { getValueAt } from "./utility/getValueAt.js";

/**
 * 
 * extendable, preparable and readable...
 * 
 * const instance = new Readable({}, {
 *     // adapters registered first 
 *     adapters: [{
 *         options: { ... },
 *         adapter: {
 *              register: (instance, options, resolve) => { ... }
 *         }
 *     }],
 *     // then preparation steps
 *     prepare: (resolve) => { ... } // instance ._isReady after resolve()
 * });
 * 
 */

// Readable instance defines how accessors relate to the target (ie a target can be a raw value or a nest of Readable instances all pointing to the roots raw value(s))
// - the idea is that .get(ting) against a Readable will return a structurally equal Readable but with updated pointers 
// - the new Readable will have the same Adapters applied and will tunnel messages through the same instances (effectively joining the instances)
// - no references point to either the gettee or the getter from within either the getter or the gettee
// - both instances will point to the same root construct which may hold further information we can use besides the raw target value
// - Readable instances are meant to be thrown away - they hold nothing but references and methods
// - In FRP terms;
//  - Adaptables are Subjects which source their events from write actions 
//  - Adapters work as registerable Observers which are self-contained (they work against the message in their own bubble and dont need to return anything)
//  - An Adapter may be registered to n* Adaptables
//  - An Adaptable itself can be an Adapter (just like an Observable can be an Observer (a Subject))
//  - Adaptables have no concept of completion or unsubscribing
//  - If you are done with an Adaptable just delete it to mark it for g/c in the next sweep (if Adapters are assoicated they can also just be deleted)
export class Readable extends Preparable {

    // instance reflects key in raw target object
    constructor(initialValue, key, options) {
        // overload the key entry before constructing
        if (typeof options == "undefined" && key && key.constructor === Object) options = key, key = undefined;
        // construct preparable but delay ready till end of this construct
        // dont feed the Adapters to construct (so that we can skip supplying parents set) supply them directly to register
        super(initialValue, false, false);
        // start with ctx as this
        let ctx = this;
        // record prepration from options/instance
        this._prepare = (this._prepare || (options && options.prepare));
        // target given (either Base instance or raw object/value)
        this._target = (typeof initialValue !== "undefined" ? initialValue : undefined);
        // place the key relative to target with the new key appended
        this._key = this.key(key, options);
        // record the provided options (spread to clear fullKey)
        this._options = (options instanceof Object ? Object.keys(options).reduce((opts, key) => {
            // remove non-cascading properties
            if (key !== "fullKey" && key !== "prepare" && key !== "adapters") opts[key] = options[key];

            // return a new object containing options
            return opts;
        }, {}) : {});
        // exposes length for strings, arrays and objects with a .length property
        Object.defineProperty(this, "length", {
            // via a getter
            get: function() {
                // produce length from raw value
                const raw = this.raw(true);

                // only return length of strings and arrays
                return (typeof raw == "string" || !isNaN(raw && raw.length) || Array.isArray(raw) ? raw.length.valueOf() : false);
            }
        });
        // set the typeof into the instance
        Object.defineProperty(this, "typeof", {
            // via a getter
            get: function() {
                // produce a type from raw value
                const raw = this.raw(true);

                // return type of !object and known objects - everything else is object
                return (this.type ? this.type : (typeof raw !== "object" ? typeof raw : (
                    raw.type ? raw.type : (
                        raw instanceof ArrayBuffer ? "arrayBuffer" : (
                            raw instanceof Date ? "date" : (
                                Array.isArray(raw) ? "array" : "object"
                            )
                        )
                    )
                ))).valueOf();
            }
        });
        // initiate the object - this step allows extenders to modify state before register
        this.init();
        // stop the options from being altered after construct - this means we can rely on the values we supply to the options always being consistent
        Object.defineProperty(this, "_options", { value: Object.freeze(this._options), configurable: false, writable: false });
        // move the preparation of this instance onto the prep of parent (if parent is also Readable and not already initiated - otherwise immediatly prepare)
        if (initialValue && typeof initialValue.onReady == "function" && initialValue._isReady !== null) {
            // wait until the source value is ready before starting registration
            initialValue.onReady(() => ctx = this.register(() => this.prepare(), (options && options.adapters)));
        } else {
            // ready after synchronously registering this prepation callback
            ctx = this.register(() => this.prepare(), (options && options.adapters));
        }

        // if ctx resolves to a promise then check _ctx placement
        if (ctx !== this && ctx instanceof Readable) {
            
            // return the alternative instance if available and Adaptable
            return ctx;
        }
    }

    // init is the first step of preparation (before loading adapters) - we might want to call .init again to alter root bindings
    init() {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // record the root location from the instance or parent instance
        ctx._root = ctx.root();
        // dont attempt to set options after first init
        if (!Object.isFrozen(ctx._options)) {
            // mutable default options for get/raw/parent
            ctx._options._get = (ctx._options._get || {});
            ctx._options._raw = (ctx._options._raw || {});
            ctx._options._parent = (ctx._options._parent || {});
        }
    }

    // gets the current key with given key attached
    key(key, options) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // if options we're not provided then default
        options = options || {};
        // allow the key to be provided as an array or a dot delim string with squarebrackets
        key = toArray(key).join(".");
        // allow for the fullKey to be expressed as a tag at the start of the key
        if (key.indexOf("~") == 0) options.fullKey = true, key = key.replace(/^~/, "");
        // check if this instance proxies to another
        const isProxy = (!options.fullKey && ctx._target instanceof Readable && typeof ctx._target._key !== "undefined" && ctx._target._key !== "");
        // retrieve either the nested key or the current instances key (current instance key is set in construct via this method)
        const current = (isProxy && !ctx._key ? ctx._target._key : (ctx._key ? ctx._key : "")).toString();
        // based on the given key being added check if a seperator is required
        const seperator = (current !== "" && key !== "" ? "." : "");

        // return the given key preceeded by the targets key if target is of Readable type
        return ((!options.fullKey ? current + seperator : "") + key.toString());
    }

    // wraps may be nested infinity - root may be cached at any stage by setting _root against an instance (which extends Readable)
    root() {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;

        // recursively move to root till we land a value that isnt a Base instance (short-circuit in the presense of _root)
        return (ctx._root ? ctx._root : (!ctx._target || !(ctx._target instanceof Readable) ? ctx : ctx._target.root()));
    }

    // return the parent position of the current key
    parent(options) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // pass the options through as a shallow clone so that the child doesnt modify parent ensuring the prepartion step can only exist at the given level
        options = Object.assign({}, ctx._options._parent, ctx._options, { prepare: undefined }, (options ? options : {}));
        // when we're not at the root position we can drop a key from the right and do a get from root
        if (ctx._root._key !== ctx._key) {
            // make an array from the current key
            const keys = toArray(ctx._key);
            // drop the last entry
            keys.pop();

            // reform the keys and get from root
            return ctx.get.call(ctx._root, keys.join("."), Object.assign({}, options, { fullKey: true }));
        }

        // return the current object at root position with options laid over the top
        return ctx.get.call(ctx._root, "", options);
    }

    // get a another instance based on the key/options pointing at (this._key + "." + key) (unless fullKey(~)=true)
    get(key, options) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // overload the key entry
        if (typeof options == "undefined" && key && key.constructor === Object) options = key, key = undefined;
        // default the key to empty string only when undefined (allowing every other falsy through)
        key = (typeof key !== "undefined" && key !== null ? key : "");
        // pass the options through as a shallow clone so that the child doesnt modify parent ensuring the prepartion step can only exist at the given level
        options = join({}, ctx._options._get, ctx._options, { 
            // adapters can be cleared with the skipAdapters prop on supplied options
            adapters: (!(options && options.skipAdapters) ? ctx._adapters : []), 
            // preparation should never cascade
            prepare: undefined, 
            // error handlers shouldnt cascade
            error: false 
        }, (options ? options : {}), true);
        // allow for the fullKey to be expressed as a tag at the start of the key
        if (key.indexOf("~") == 0) options.fullKey = true, key = key.replace(/^~/, "");
        // record the full key (as given) were placing the next requested item against the root to collapse the nest
        const fwdKey = (!options.fullKey ? ctx._key + (ctx._key && key ? "." : "") : "") + key;
        // * note that we only ever need to place the target 1 position away from root because the root will contain 
        //   all/any additional meta and we dont need to sustain a parent-child rel because the only important detail 
        //   is the key that points to a value in the roots target - this helps for gc by reducing the number of intermediaries that might get ref locked
        let response = new ctx.constructor(ctx._root, fwdKey, Object.assign({}, options, { fullKey: true }));

        // return the response
        return response;
    }

    // return this._key in the root object
    raw(skipClone, skipRefresh) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // check for alternative rawing method assigned via options
        if (ctx._options._raw && ctx._options._raw.fn) {
            // retrieve value by adapted means
            const value = ctx._options._raw.fn(skipRefresh);

            // provide skipClone to get back the true reference (else get back a deepClone)
            return (skipClone ? value : clone(value));
        } else {
            // pass the same arguments if cloning or not
            const value = getValueAt(ctx._root._target, ctx._key, Object.assign({}, ctx._options, ctx._options._raw));

            // provide skipClone to get back the true reference (else get back a deepClone)
            return (skipClone ? value : clone(value));
        }
    }

    // valueOf allows us to use the raw values directly under some conditions... (like equality checks against the object)
    valueOf() {

        // should always reflect the raw content
        return this.raw(true);
    }

    // toJSON is called when the object is JSON.stringify'ed
    toJSON() {

        // should always reflect the raw content no need to clone
        return this.raw(true);
    }

    // return a signiture denoting Readable instance on toString
    toString() {

        // type given to Readable instance
        return "[object Readable]";
    }

}
