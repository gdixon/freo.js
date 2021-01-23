// Writable will extend Readables functionality with write methods (set and delete)
import { Readable } from "./readable.js";

// check if a value is a primitive Object/Array
import { isObject } from "./utility/isObject.js";

// merge all provided objects into a single object left to right
import { merge } from "./utility/merge.js";

// deep shallow merge left on provided ...args using concat to place new items
import { join } from "./utility/join.js";

// immutable version of setValueAt
import { setValueAt } from "./utility/setValueAt.js";

// return a casting method
import { toArray } from "./utility/toArray.js";

// Introduce set and delete to Readable
export class Writable extends Readable {

    // construct Base instance nothing new to declare
    constructor(target, key, options) {
        // construct the Base passing nothing extra in
        super(target, key, options);
    }

    init() {
        // init on Readable
        super.init();
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // dont attempt to set options after first init
        if (!Object.isFrozen(ctx._options)) {
            // additional options supplied to methods - built against instance so that they can be altered by Adapters
            ctx._options._set = (ctx._options._set || {});
            ctx._options._delete = (ctx._options._delete || {});
            ctx._options._undo = (ctx._options._undo || {});
            ctx._options._redo = (ctx._options._redo || {});
        }
    }

    // set value to the current branch - optional key and options ({} -> fullKey, creationMaxDepth, typesafe, replaceRoot, immutable, dropped, written)
    set(value, key, options) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // overload the key entry
        if (typeof options == "undefined" && key && key.constructor === Object) options = key, key = undefined;
        // new object from options (* note that forceNotify supercedes skipNotify)
        options = (!options ?
            // combine the default delete options with the instances options and provided options
            join({}, ctx._options._set, ctx._options, true) :
            join({}, ctx._options._set, ctx._options, options, true)
        );
        // allow for the fullKey to be expressed as a tag at the start of the key
        if (key && key.indexOf("~") == 0) options.fullKey = true, key = key.replace(/^~/, "");
        // access the write log here so that undo can reference the mutable collection (filled by setValueAt)
        let dropped = options.dropped || {}, written = options.written || {};
        // response is built up over-time - we first get response from setValueAt then wrap it using constructUndo
        let response = false;
        // reference the root because most of the work is carried out against that instance
        const root = ctx._root;
        // prefix this key to the descendents key (if supplied) and create a usable key in this context (exploded dot-deliminated property key)
        const entryKeys = toArray((options.fullKey ? key : (ctx._key || "") + (ctx._key && key ? "." : "") + (key || "")));
        // check the options for immutable to check how the value will be set against the raw target - root supersceeds this which superscedes the supplied option
        const immutable = (root._options.immutable || ctx._options.immutable || options.immutable);
        // take a copy of the original root._target values (shallow clone)
        const original = (isObject(root._target) ? merge(root._target.constructor(), root._target) : root._target);
        // record the old target by reference
        const prevTarget = root._target;
        // if we're setting mutable at root we need to clear the intialObject so that we can add properties to with a merge
        if (!isObject(root._target) && (immutable || options.replaceRoot === true) && entryKeys.length > 0) {
            // set up as an object before setting so that the key entry has something to set against
            root._target = {};
        }
        // replace the given key with the entryKeys rejoined to ensure not special chars remain to polute the key
        key = entryKeys.join(".");
        // record the full options after combining with options._set
        options = join({}, options, {
            // register mutable option (if outside is immutable this must follow)
            immutable: root.immutable || immutable,
            // forward the error handler (this will bubble to root if no error handler is directly assigned)
            error: options.error || ctx.error.bind(ctx),
            // written will contain fullKey=>value for each value written by the operation (final leaf of key - mutable collection)
            written: written,
            // dropped will contain fullKey=>value for each value deleted by the operation (final leaf of key - mutable collection)
            dropped: dropped,
        }, true);
        // construct the types store once (against the root level) - ensuring the key follows consistent form
        response = setValueAt(root._target, key, value, options);
        // check if both (before and after) are objects
        const bothObjects = isObject(response) && isObject(root._target);
        // if dropped is an array then the dropped we care about is at length-1 position
        if (Array.isArray(dropped)) dropped = dropped[dropped.length - 1];
        // check how the value should be placed at root (allowing for mix of replaceRoot and immutable)
        if (immutable && bothObjects && options.replaceRoot === false) {
            // clear the values from the original target (so that we can set the properties from the response on a clean slate but mutable)
            if (!options.merge) Object.keys(root._target).forEach((key) => delete root._target[key]);
            // insert all values from the new value - defaulting to empty constuctor if no value is given
            root._target = merge(root._target, response);
        } else if (!immutable && options.replaceRoot === true) {
            // apply original to the dropped elements and replace the root instance
            if (response !== prevTarget) {
                // replace the root of the construct
                root._target = response;
                // mark that we wrote the response to root
                written[""] = response;
                // ensure that the replacement is recorded in the dropped struct
                dropped[""] = original;
            }
        } else {
            // place over the root in immutable mode or if replaceRoot is set (this sets primitives only when allowed)
            if (immutable) {
                // set the target to the response instance (could be either immutable or mutable if replaceRoot is set)
                root._target = response;
            } else if (key == root._key) {
                // check if the original root reference should absorb the response values
                if (bothObjects) {
                    // insert all values from the new value - defaulting to empty constuctor if no value is given
                    root._target = merge(root._target, response);
                } else {
                    // delete the root written entry
                    // delete written[root._key];
                }
            }
        }
        // return a method to reverse the setting action (* note that this will blindly return the values even if they were since changed)
        response = constructUndo.call(ctx, key, value, written, dropped, options);
        // check that response returned
        if (Object.keys(written).length && !(options.skipMessage && options.skipMessage.src && options.skipMessage.src == "delete")) {
            // notify the deletion to adapters
            ctx.next({
                method: "set",
                key: response.key,
                written: written,
                dropped: dropped,
                response: response,
                // record the given value
                given: value,
                // pull the new value in - this will check for empties vs deletes
                value: (!options.skipMessage ? ctx.get("~" + (key || "")).raw(true, -1) : value),
                // hydrate the meta details into the call
                ...(options.meta && options.meta.constructor == Object ? options.meta : {}),
                // tunnel the skipMessage property through
                ...(options.skipMessage ? { skipMessage: options.skipMessage } : {})
            });
        }

        // return the response
        return response;
    }

    // delete from the current branch - optional key and options ({} -> fullKey, replaceRoot, immutable, dropped, written)
    delete(key, options) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // overload the key entry
        if (typeof options == "undefined" && key && key.constructor === Object) options = key, key = undefined;
        // new object from options (* note that forceNotify supercedes skipNotify)
        options = (!options ?
            // combine the default delete options with the instances options and provided options
            join({}, ctx._options._delete, ctx._options, true) :
            join({}, ctx._options._delete, ctx._options, options, true)
        );
        // reference the write events in the notification
        const written = options.written || {}, dropped = options.dropped || {};
        // delete is a passthrough for setting undefined at the key property (returns undo block to reinstate)
        const response = ctx.set(null, key, Object.assign({}, options, {
            // tag state listeners
            written: written,
            dropped: dropped,
            // ensure nothing is created when calling
            creationMaxDepth: 0,
            // skip history from this movement already accounted for when .delete is wrapped
            skipMessage: { src: "delete" },
        }));
        // check that response returned
        if (Object.keys(written).length) {
            // notify the deletion to adapters
            ctx.next({
                method: "delete",
                key: response.key,
                written: written,
                dropped: dropped,
                response: response,
                // record the given value
                given: null,
                // pull the new value in - this will check for empties vs deletes
                value: ctx.get("~" + (key || "")).raw(true, -1),
                // hydrate the meta details into the call
                ...(options.meta && options.meta.constructor == Object ? options.meta : {}),
                // tunnel the skipMessage property through
                ...(options.skipMessage ? { skipMessage: options.skipMessage } : {})
            });
        }

        // return response with undo/redo logic
        return response;
    }

    // produces a new immutable instance to contain the actions - when the transaction synchronously completes set the content back to original source
    transaction(fn, key, options) {
        // allow the transaction to be cancelled
        let cancelled = false;
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // overload the key entry
        if (typeof options == "undefined" && key && key.constructor === Object) options = key, key = undefined;
        // new object from options (* note that forceNotify supercedes skipNotify)
        options = (!options ?
            // combine the transaction options with the root level and provided options
            join({}, ctx._options._transaction, ctx._options, true) :
            join({}, ctx._options._transaction, ctx._options, options, true)
        );
        // allow for the fullKey to be expressed as a tag at the start of the key
        if (key && key.indexOf("~") == 0) options.fullKey = true, key = key.replace(/^~/, "");
        // produce a key to tie the transaction against
        const fullKey = (options.fullKey ? key : (ctx._key || "") + (ctx._key && key ? "." : "") + (key || ""));
        // contain the actions on a new instance which is immutable (this cannot be altered inside the transaction all actions are immutable)
        const transactTarget = new ctx.constructor(ctx._root._target, fullKey, Object.assign({}, options, { fullKey: true, transaction: true, immutable: true }));
        // cancel the transaction by marking anchor
        const reject = () => (cancelled = true);
        // finish the response by returning the set response (operation with undo method)
        const resolve = () => {
            // merge the values in (clear adapters from options so that they dont persist and clog options)
            if (!cancelled) return ctx.set(transactTarget.raw(true), fullKey, Object.assign({}, options, {fullKey: true}));
        };
        // get the response of the target
        const response = fn.call(transactTarget, reject);
        // check if the response is a promise or not
        if (Promise.resolve(response) === response) {

            // catch the errors and pass to handler
            return response.catch((err) => {
                // mark as cancelled
                reject();
                // throw error to handler
                (options.error || ctx.error).call(ctx, err, { err: err, key: fullKey, caller: ctx, method: "transaction" });
            }).then(resolve);
        }

        // transaction was cancelled
        return resolve();
    }

    // return a signiture denoting Base instance on toString
    toString() {

        // type given to Base instance
        return "[object Writable]";
    }
}

// export an object that holds an undo method (and the key) - if no undo is appropriate for the action just return key
const constructUndo = function (key, value, written, dropped, options) {
    // hold reference to the Writable instance - (undo methods hold reference over options, value, dropped and written - be careful how theyre managed)
    const ctx = this._ctx || this;
    // check if the response modifies values before producing an undo method
    const response = (Object.keys(written).length == 0 ? {
        key: key
    } : {
        // key being controlled by the returned methods
        key: key,
        // record the instance that will be undone into the action obj
        target: ctx,
        // reverse the action of the set operation
        undo: function (undoOptions) {
            // single target shared between drops
            const target = ctx.get("", { fullKey: true });
            // construct options relating to the call
            const optionSet = join({}, ctx._options._undo, options, {
                // allow all creations - the key is complete so we can trust its judgement
                creationMaxDepth: -1,
                // clear meta from prev op so that its not repeated
                meta: {},
                // clear these out from the setting procedures options so that theyre filled with only the details of this action
                valuesSet: false
            }, undoOptions, {
                // assigning against a fullKey - instructs set to skip affixing root._key
                fullKey: true,
                // shouldnt be merging on the way back
                merge: false,
                // mark message for skipping
                skipMessage: { src: "undo" },
            }, true);
            // store proper reference to new dropped/written
            optionSet.dropped = undoOptions && undoOptions.dropped || {};
            optionSet.written = undoOptions && undoOptions.written || {};
            // iterate modified values
            Object.keys(dropped).reverse().forEach((key) => {
                // nothing to return/collect here allow the response to be dropped and g/c'd
                target.set(dropped[key], key, optionSet);
            });
            // construct the redo response
            const redo = constructRedo.call(ctx, key, value, options, undoOptions);
            // drop the internal redo if nothing was undone
            if (!Object.keys(optionSet.written).length) delete redo.redo;
            // notify the deletion to adapters
            ctx.next({
                method: "undo",
                key: key,
                action: this,
                response: redo,
                // always produce the value via a get so we that we send all changes associated with the key
                value: ctx.get("~" + key).raw(true, -1),
                // tunnel the skipMessage property through
                ...(undoOptions && undoOptions.skipMessage ? { skipMessage: undoOptions.skipMessage } : {})
            });

            return redo;
        }
    });

    return response;
};

// export an object that holds a redo method that resets (or redeletes) the same value that the original operation (which was undone) set (or deleted)
const constructRedo = function (key, value, options, undoOptions) {
    // hold reference to the Writable instance - (undo methods hold reference over writable, options, value - be careful how theyre managed)
    const ctx = this._ctx || this;
    // check if the response modifies values
    const response = {
        // key being controlled by the returned methods
        key: key,
        // record the instance that will be redone into the action obj
        target: ctx,
        // reverse the action of the undo Operation (re-.sets the values fed to .set)
        redo: function (redoOptions) {
            // single target shared between drops
            const target = ctx.get("", { fullKey: true });
            // construct the full optionset
            const optionSet = join({}, ctx._options._redo, options, undoOptions, {
                // clear meta from prev op
                meta: {},
                // clear these out from the setting procedures options so that theyre filled with only the details of this action
                valuesSet: false
            }, redoOptions, {
                fullKey: true,
                // apply skipMessage to the options to stop adapters responding that dont need to
                skipMessage: { src: "redo" }
            }, true);
            // store proper reference to new dropped/written
            optionSet.dropped = redoOptions && redoOptions.dropped || {};
            optionSet.written = redoOptions && redoOptions.written || {};
            // construct the opposite response again for the redo (sets to original value)
            const undo = target.set(value, key, optionSet);
            // notify the deletion to adapters
            ctx.next({
                method: "redo",
                key: key,
                action: this,
                response: undo,
                // always produce the value via a get so we that we send all changes associated with the key
                value: ctx.get("~" + key).raw(true, -1),
                // tunnel the skipMessage property through when set
                ...(redoOptions && redoOptions.skipMessage ? { skipMessage: redoOptions.skipMessage } : {}),
            });

            // work against the given instance discovered by undo (this might be an instance which extends Writable and should be passed in)
            return undo;
        }
    };

    return response;
};