// import getValueAt to discover the values if not in cache
import { getValueAt } from "../../utility/getValueAt.js";

// extend from Adapter base
import { Adapter } from "../../adapter.js";

// type check the value being fed to CacheAdapters get
import { Readable } from "../../readable.js";

// constuct a cache of all keys as we set/delete/raw them - theres not much point in constraining this by key...
export class CacheAdapter extends Adapter {

    _register(target) {
        // constuct a cache of keys
        if (!this._cache) this._cache = {};
        // place a method into the options to get the raw value from this instances flat cache
        target._options._raw.fn = (skipRefresh) => {
            
            // return the cached value
            return this.get(target, skipRefresh);
        };
    }

    _next(message) {
        // receive all set and delete events
        if (message.method == "set" || message.method == "delete") {
            // merge the written values into the cache
            Object.keys(message.dropped).forEach((key) => {
                // remove old datas decsendants
                deleteAll.call(this, message.dropped[key], key);
            });
            // merge the written values into the cache
            Object.keys(message.written).forEach((key) => {
                // only accepting sets/deletes in the outer so this must be either a set or delete op
                if (message.method == "set") {
                    // set the cache position
                    this._cache[key] = message.written[key];
                }
            });
        }
    }
    
    _unsubscribe(target) {
        // check for key as target
        const key = (typeof target === "string" ? target : target._key);
        // delete the cached items
        deleteAll.call(this, this._cache[key], key);
    }

    get(target, skipRefresh) {
        // check for key as target
        const key = (typeof target === "string" ? target : target._key);
        // check if the key points to a wildcard position
        const hasSpecials = (key.match(/\*|\|/) !== null);

        // retrieve the value from the associated key (skipRefresh:-1 forces a refresh)
        return (skipRefresh !== -1 && (!hasSpecials || skipRefresh) && typeof this._cache[key] !== "undefined" ? 
            // get the value from the cache
            this._cache[key] : 
            // if the target isnt a Readable instance then we cant attempt to retrieve the value
            (!(target instanceof Readable) ? undefined : 
                // if the value is wildcarded we cant rely on the cache because theres too many ways the results could be altered
                (this._cache[key] = getValueAt(target._root._target, target._key, Object.assign({}, target._options, target._options._raw)))
            )
        );
    }
}

// delete everything under a given key in the instances cache
const deleteAll = function (left, key) {
    // delete the entry from the cache
    delete this._cache[key];
    // flat map the keys and delete the entry
    if (left && (left.constructor == Object || left.constructor == Array)) {
        // if the value holds an object delete its content
        Object.keys(left).forEach((nodeKey) => {
            // recursively delete everything from the cache
            deleteAll.call(this, left[nodeKey], (key + (key ? "." : "") + nodeKey));
        });
    }
};