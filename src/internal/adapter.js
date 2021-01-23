// Adapter interface - Adapters are registered against targets (Adaptables) and receive events on .register, .next, .error, .complete and .unsubscribe
export class Adapter {

    constructor(register, message, error, complete, unsubscribe) {
        // accept handlers as args at construct else use Adapter (extending constructs) defined fns
        this._register = register || this._register;
        this._next = message || this._next;
        this._error = error || this._error;
        this._complete = complete || this._complete;
        this._unsubscribe = unsubscribe || this._unsubscribe;
        // control the open/closed state of an Adapter -- if its closed then drop on register
        this.closed = false;
        this.isStopped = false;
    }

    // register the adapter into the target
    register(target, adapter) {
        // if this adapter is loaded is closed state (but not complete) then drop the adapter
        if (this.closed) {
            // drop the adapter from the target
            if (target._adapters.indexOf(adapter) !== -1) target._adapters.splice(target._adapters.indexOf(adapter), 1);
        } else {

            // register the adapter against the target
            return this._register && this._register(target, adapter);
        }
    }

    // send the message to this adapter
    next(message) {
        // forward the message if the Adapter isnt closed
        if (this._next && !this.closed) {
            // record the message
            try {
                // push message to the observer
                message = this._next(message);
            } catch (e) {
                // push error through
                this.error(e);
            }

            // return the result of this message
            return message;
        }
    }

    // * note that errors in an Adapter (unlike in an Observer) will not close the Adapters stream
    error(error, details) {
        // forward the error if the Adapter isnt closed
        if (this._error && !this.closed) {

            // return the result of this error
            return this._error(error, details);
        }
    }

    // mark the work as isStopped and unsubscribe
    complete(target, adapter, single) {
        // ensure the chain has not already completed/unsubscribed
        if (!this.isStopped && (!single || (single == adapter))) {
            // only mark complete when called directly without a target
            if (!target) this.isStopped = true;
            // attemp to run adapters internal complete method
            if (this._complete) {
                // attempt the complete call
                try {
                    // call fn and test if the completion should propagate to an unsubscribe call (should only happen on the final chained observers complete)
                    this._complete(target, adapter, single);
                } catch (e) {
                    // propagate error through this subscriber
                    this.error(e, {err: e, caller: this, method: "complete"});
                }
            }
            // final Subscriber in the chain is responsible for calling out to the unsubscribe operation after a complete but it shouldnt drop from the target
            this.unsubscribe(target, adapter, single, true);
        }

        // return the target if it was provided
        return target;
    }

    // unsubscribe this adapter from the target (adapter param might contain this instance as .adapter)
    unsubscribe(target, adapter, single, skipSlice) {
        // unsubscribe should only be called once
        if (!this.closed && (!single || (single == adapter))) {
            // an Observer can only be closed/!closed (no isStopped state)
            if (!target) this.closed = (this.isStopped ? this.closed : true);
            // always stop on complete/unsubscribe
            if (!target) this.isStopped = true;
            // unsubscribe will finalise an Observer - no new messages on any method after this point
            if (this._unsubscribe) {
                // try and catch any errors
                try {
                    // allow the Observer to unsubscribe by its own terms (if single is passed then the adapter might not move to .isStopped)
                    this._unsubscribe(target, adapter, single);
                } catch (e) {
                    // push error through from here (which will skip through the closed state
                    if (this._error) this._error(e, {err: e, caller: this, method: "unsubscribe"});
                }
            }
            // make sure target is provided before we attempt to drop it (we'll drop it properly on the next tick)
            if (!skipSlice && target && target._adapters && target._adapters.indexOf(adapter) !== -1) {
                // drop the adapter from the target
                target._adapters.splice(target._adapters.indexOf(adapter), 1);
            }
        }

        // return the target if it was provided
        return target;
    }
}