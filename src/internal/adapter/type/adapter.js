// construct a Writable instance to hold the types
import { Writable } from "../../writable.js";

// return a casting method
import { getType } from "../../utility/getType.js";

// provide type annotations to another Writable instance
export class TypeAdapter extends Writable {

    constructor(target, key, options) {
        // construct the Types as a seperate Writable instance
        super(target || {}, key, options);
    }

    init() {
        // register writable
        super.init();
        // where should the types by stored internally?
        this._definition = "_type";
        // enable type safety for all sets (also used by delete)
        this._options._set = {
            // combine orignals and extend...
            ...this._options._set, ...{
                // stop setValue at from following * defintions instead assigning them all to objects
                disableWildcard: true,
                // if the type is being set...
                asDefinition: true,
                // definition being set in this operation - only relevent when asDefinition = true
                definition: "_type",
                // should this be set with typesafety (ensures the type given and placed at fn: is a function)
                typesafe: true,
                // force type on key
                types: {
                    // type check the type were setting... 
                    // -- * note that setValueAt can only read types from _type (ie options.definition defines where the 
                    //      value should be set and not where the _type is)
                    _type: {
                        // cast the type as a function method
                        fn: (type) => (type && type._type && typeof type._type.fn == "function" ? type : undefined)
                    }
                },
                // allow for the structure to be built if it doesnt already exist
                creationMaxDepth: -1,
            }
        };
        // enable definition structure in getValueAt...
        this._options._raw = {
            // combine orignals and extend...
            ...this._options._raw, ...{
                // stop setValue at from following * defintions instead assigning them all to objects
                disableWildcard: true,
                // mark that we're getting a definition
                asDefinition: true,
                // position of definition record - only relevent when asDefinition = true
                definition: "_type"
            }
        };
        // disable typesafety on deletes
        this._options._delete = { ...this._options._delete, typesafe: false };
        // disable typesafety on undo/redo
        this._options._undo = { ...this._options._undo, typesafe: false };
        this._options._redo = { ...this._options._redo, typesafe: false };
    }

    register(target) {
        // check if the given target maps to a function or a callback...
        if (target && typeof target !== "function") {
            // allow for the registration of target to happen either synchronously or asynchronously
            const registerTarget = () => {
                // if the call was marked as complete then allow for it to still be registered
                if (!this.closed) {
                    // register the types instance against the target - record the key from the first target we register against
                    if (!this._registered && (this._registered = true)) this._key = target._key;
                    // assign the types to the construct
                    target._options._set["types"] = this._root;
                    // mark typesafety so all future sets absorb setting
                    target._options._set["typesafe"] = true;
                }
            };

            // allow the Types to be prepared asynchronously or synchronously depending on ready state
            return (!this._isReady ?
                // wait until this instance is ready before registering
                new Promise((resolve) => {
                    // delay resolution of the reg and the promise until the instance is ready
                    this.onReady(() => resolve(registerTarget()));
                }) :
                // register the target synchronously
                registerTarget()
            );
        } else {
            // register constructor provided adapters into this instance (Writable.register)
            super.register(...arguments);
        }
    }

    // hijack the set to ensure that we're setting a type according to the definition
    set(value, key, options) {
        // if closed is called no more setting...
        if (!this.isStopped) {
            
            // set into the writable
            return super.set({
                // place definition against the _type prop to define as a type
                _type: {
                    // fn should always be a fn which settles the wanted type (undefined for rejection)
                    fn: (typeof value === "function" ? value : getType(value))
                }
            }, key, options);
        }
    }

    // mark the work as completed
    complete(target, adapter) {
        // ensure the chain has not already completed/unsubscribed
        if (!this.isStopped) {
            // only mark complete when called directly without a target
            if (!target) this.isStopped = true;
            // final Subscriber in the chain is responsible for calling out to the unsubscribe operation after a complete
            this.unsubscribe(target, adapter);
        }
    }

    // call to the provided unsubscribe method and close the Observer wrapper
    unsubscribe(target, adapter) {
        // unsubscribe should only be called once
        if (!this.closed) {
            // follow same closing structure as observable/adapter
            if (!target) this.closed = (this.isStopped ? this.closed : true);
            // always stop on complete/unsubscribe
            if (!target) this.isStopped = true;
            // duck type writables by checking for options with a _set obj
            if (target) {
                // assign the types to the construct
                target._options._set["types"] = false;
                // mark typesafety so all future sets absorb setting
                target._options._set["typesafe"] = false;
            } else if (this.closed) {
                // clear the set
                this._target = {};
            }
            // make sure target is provided before we attempt to drop it (we'll drop it properly on the next tick)
            if (target && target._adapters && target._adapters.indexOf(adapter) !== -1) {
                // drop the adapter from the target
                target._adapters.splice(target._adapters.indexOf(adapter), 1);
            }
        }
    }
}