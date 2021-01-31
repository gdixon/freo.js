// record all changes made to the schema (made after prepare) - on register wrap all given methods record changes after onReady
// this should retain a single obj that contains only the changes made at the positions they were changed ie multiple edits dont feed the set we upload

// this would be a partial set of data (hopefully) and we could use it to feed the upload side on reconnects?

// on the backend of this I need to be able to receive the flat key and the values that are set so I can attempt them individually and fail/activate stuff appropriately
// say we change the state to "sent" that should trigger a send on reconnect, we should tackle that (and maybe everything) as individual commands
// if they go through the socket server - its no drama anyway - and everything can comeback down the same tunnel
// just need a way to process the traffic from node into php without causing any issues (we want to work against the php session?)

// should have a clear method to drop the current structure

import { Writable } from "../../writable.js";

// given both a flat key and a wildcarded key (a.a|b, a.*) check for a definition match (using regex)
import { matchKey } from "../../utility/matchKey.js";

// import the base Adapter
import { Adapter } from "../../adapter.js";

export class ChangesAdapter extends Adapter {

    constructor(key, methods, options) {
        // check if args are provided as an object
        let args = false;
        // allow methods to be optional
        if (key && key.constructor === Object) args = key; 
        // allow methods to be optional
        if (!args && methods && methods.constructor === Object) args = methods; 
        // dehydrate the args
        if (args) {
            // pull the key from either key or args
            key = (args !== key ? key : args.key);
            // instrument the targets that we register against using the following methods...
            methods = args.methods;
            // allow for settingDefinition etc to be fed in to the _changes
            options = (args.options || (!methods ? args : {})); 
        }
        // construct the instance
        super();
        // manually set the key which constrains the adapter on construct
        this._key = key;
        // instrument the targets that we register against using the following methods...
        this._methods = methods || ["set", "delete"];
        // allow for settingDefinition etc to be fed in to the _changes
        this._options = options || {}; 
        // allow for the recording of state/changes to be opened/closed
        this._active = false;
        // this is the raw subject of the _changes Writable
        this._state = {};
        // feed the state and the options into a new instant
        this._changes = this._options.writableInstance || new Writable(this._state, Object.assign({}, { replaceRoot: true, creationMaxDepth: -1 }, this._options));
    }

    _register(target) {
        // register the root once per instance
        if (target && !this._prepared && !this._active && (this._prepared = true)) {
            // record this key as root of the changes collection
            this._key = (typeof this._key === "undefined" ? target._key : this._key);
            // wait until ready before recording changes
            target.onReady(() => {
                // start in active state
                this._active = true;
            });
        }
    }

    _next(message) {
        // apply the changes over to the changes instance
        if (this._active && this._methods.indexOf(message.method) !== -1 && (matchKey(message.key, this._key).length || matchKey(this._key, message.key).length)) {
            // process the written messages into the changes instance
            const process = function(written) {
                // write all values from written over the current instant - this saves having to maintain an access log with only current entries
                Object.keys(written).forEach((key) => {
                    // apply the value to changed instance
                    this.get(key, { fullKey: true }).set(written[key]);
                });
            };
            // write the written values over to the instances copy - working against the written allows us to respect the shape of the current target (allowing wildcard sets to be recorded)
            this._changes.transaction(function () {
                // process the changes
                if (message.written && message.written.constructor == Array) {
                    // process each set of written values
                    message.written.forEach((written) => {
                        // process from written obj
                        process.call(this, written);
                    });
                } else {
                    // process from written obj
                    process.call(this, message.written);
                }
       
            });
        }
    }

    clear() {
        // delete from root of the state
        this._changes.set((this._state = {}));
    }

    stop() {
        // stop recording changes
        this._active = false;
    }

    start() {
        // start recording changes
        this._active = true;
    }

    read() {
        // process into a flat list of values
        const raw = this.raw(true), log = {};

        // process each member and return a flat obj of key=>val
        return (function process(k, p, prefix) {
            // grab the target (if no key at root)
            const target = (k === "" ? p : p[k]);
            // process the fullKey from prev tick
            const fullKey = (prefix || "") + (prefix && k.toString() ? "." : "") + k;
            // check the object type and recurse
            if (target && target.constructor === Object) {
                // process the keys from the object
                Object.keys(target).forEach((ik) => process(ik, target, fullKey));
            } else if (target && target.constructor === Array) {
                // process the items from the arr at key position
                target.forEach((...[, ik]) => process(ik, target, fullKey));
            } else {
                // log the target at its fullKey position
                log[fullKey] = target;
            }
        
            // final response of log will be complete with all values as a flat key->value map
            return log;
        })("", raw);   
    }
    
    raw(skipClone) {

        // transport the check to the changes target
        return this._changes.raw(skipClone);
    }
}
