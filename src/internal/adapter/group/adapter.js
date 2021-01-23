
// extend Adaptable and implement Adapter
import { Adaptable } from "../../adaptable.js";

// check for proto on given obj
import { isConstructor } from "../../utility/isConstructor";

// export an Adaptable Adapter to adapt targets with a group of Adapters
export class GroupAdapter extends Adaptable {

    constructor(adapters) {
        // if the Adapters are provided raw then create a new instance of each to hold against this Adaptable
        super(false, adapters && adapters.map((adapter) => {

            // check for constructor at adapter 
            return (isConstructor(adapter) ?
                // construct or check if theres a constructor at adapter.adapter
                new adapter() : (isConstructor(adapter.adapter) ?
                    // construct or return adapter as is
                    { ...adapter, adapter: new adapter.adapter(...(adapter.args || [])) } : adapter
                )
            );
        }) || [], false);
        // Adapter open/closed state
        this.closed = false, this.isStopped = false;
        // record the last message and the last error
        // this._lastMessage = undefined, this._lastError = undefined;
    }

    // it might make sense to have subscriptions here so we can support multi-targets??

    register(target, adapter) {
        // record the root of the target if this is the first target we see so that we can dispose of it later (might need to collect all targets we see with different roots?)
        // if (!this._source) this._source = target._root;
        // if the instance has been completed then drop from Adapter from the targets _adapters []
        if (this.isStopped && !this.closed) {
            // if this adapter is loaded inside a transaction or this adapter is closed - drop the adapter for future builds
            if (target._adapters.indexOf(adapter) !== -1) target._adapters.splice(target._adapters.indexOf(adapter), 1);
        } else {

            // register each of the adapters to the target but dont save references (because messages will multicast through this GroupAdapter to each Adapter)
            return this._adapters.reduce((prev, adapter) => {
                // resolve the following for each adapter after the prev is registered
                const resolve = () => {

                    // return an optional Promise to chain the registrations
                    return target.subscribe(adapter, false);
                };
                // if any in the pipe are async then return a promise...
                if (Promise.resolve(prev) == prev) {

                    // wait for registration on prev before registering the next
                    return prev.then(resolve);
                } else {

                    // return the resolved adapter registration immediately
                    return resolve();
                }
            }, {});
        }
    }

    next(message) {
        // check if the message has been consumed yet
        if (!this.isStopped) {
            // record the last message
            // this._lastMessage = message;

            // recast the notifications to the adapters
            return this._adapters.reduce((message, adapter) => {

                return (adapter.next ?
                    adapter.next(message) :
                    (adapter.adapter && adapter.adapter.next && adapter.adapter.next(message))
                ) || message;
            }, message);
        }
    }

    error(err, details) {
        // check if the error has been consumed yet 
        if (!this.isStopped) {
            // record the last error
            // this._lastError = err;

            // recast the notifications to the adapters
            return this._adapters.reduce((err, adapter) => {

                // chain the error through the handlers
                return (adapter.error ?
                    adapter.error(err, details) :
                    (adapter.adapter && adapter.adapter.error && adapter.adapter.error(err, details))
                ) || err;
            }, err);
        }
    }

    // iterates on this._adapters and calls the complete method on each Adapter dropping instance from targets/parents._adapters 
    // - if single is provided will just remove that entry - if single is this group - will only complete here not the children
    complete(target, adapter, single, parent) {
        // check if the error has been consumed yet 
        if (!this.isStopped) {
            // mark as stopped
            if (!target && !single) this.isStopped = true;
            // close the requested connection(s) against the target/parent 
            this.unsubscribe(target, adapter, single, parent, "complete");
        }
    }

    // iterates on this._adapters and calls the unsubscribe method on each Adapter dropping instance from targets/parents._adapters 
    // - if single is provided will just remove that entry - if single is this group - will only unsubscribe here not the children
    unsubscribe(target, adapter, single, parent, method) {
        // only perform unsubscribe once per invoke
        if (!this.closed) {
            // stop future calls (after this unsubscribe has been emitted if it wasnt sourced from a complete);
            if (!target && !single) this.closed = (this.isStopped ? this.closed : true);
            // always mark as stopped
            if (!target && !single) this.isStopped = true;
            // close the requested connection(s) against the target/parent 
            dispose.call(this, (method || "unsubscribe"), target, adapter, single, parent);
        }
    }
}

// allow the completing/unsubscribing of a single adapter, all contained Adapters, or just this group...
const dispose = function(method, target, adapter, single, parent) {
    // if the single isnt on this node
    if (!single || (single && single !== this && single.adapter !== this)) {
        // mark the group we're working against
        let grouped = this;
        // reconstruct a group without the item we just unsubscribed
        if (single) grouped = new GroupAdapter(this._adapters);
        // recast the notifications to the adapters
        grouped._adapters.concat().forEach((adapter) => {
            // check if descendent is a group
            if (single && (adapter instanceof GroupAdapter || adapter.adapter instanceof GroupAdapter)) {
                // allow the Observer to unsubscribe by its own terms
                if (adapter[method]) adapter[method](target, adapter, single, grouped);
                // check for nested adapter        
                else (adapter.adapter && adapter.adapter[method] && adapter.adapter[method](target, adapter, single, grouped));
            } else if (single) {
                // if complete is available on adapter...
                if (adapter[method]) adapter[method](target, adapter, single);
                // check for nested adapter        
                else (adapter.adapter && adapter.adapter[method] && adapter.adapter[method](target, adapter, single));
            }
        });
        // replace the targets group of adapters with the altered set
        if (single) {
            // settle the grouped instance back inside its construct (if wrapped)
            grouped = (adapter instanceof GroupAdapter ? grouped : { ...adapter, adapter: grouped });
            // register the new grouped instance
            (grouped && grouped.adapter || grouped).register(target, grouped);
            // splice this into the adapters
            (parent || target)._adapters.splice((parent || target)._adapters.indexOf(adapter), 1, grouped);
        } else if (method === "unsubscribe") {
            // remove the full group from the source (do we need this - could just get dropped on next tick?)
            // this._source._adapters.splice(this._source._adapters.indexOf(adapter), 1);
        }
    } else {
        // splice this from the target or the parents adapters
        (parent || target)._adapters.splice((parent || target)._adapters.indexOf(adapter), 1);
    }
};
