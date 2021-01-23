// extend from Adaptable inorder to register Adapters against Preparable instances
import { Adaptable } from "./adaptable.js";

// allow for the instance to accept a function via onReady which will be called only after this.ready is called
export class Preparable extends Adaptable {

    constructor(parent, adapters, ready, preparation) {
        // construct the adapters
        super(parent, adapters, false);
        // record the reperation step
        this._prepare = preparation;
        // queue all fns supplied to .onReady and call in sequence when .ready is called
        this._queuedFns = [];
        // start in not ready state - when .ready is called - move to null then to true to mark completion -- if error before complete expect null
        this._isReady = false;
        // mark suspended if we need to wait for something to happen before ready
        this._isSuspended = false;
        // move the preparation of this instance onto the prep of parent (if parent is also Readable - otherwise immediatly prepare)
        if (parent && ready && typeof parent.onReady == "function") {
            // register when the parent is ready
            parent.onReady(() => this.register(() => this.prepare())); 
        } else if (ready) {
            // register immediately
            this.register(() => this.prepare());
        }
    }

    // make ready after running through option fed prepare method
    prepare() {
        // take note of the ctx
        const ctx = this._ctx || this;
        // ensure we're not already ready
        if (!this._isReady) {
            // reference the prepare options then delete it so that we dont attempt preparation more than once
            const prepare = ctx._prepare;
            // clear the preperation step before calling - this action will only ever be performed once per set-up
            delete ctx._prepare;
            // when prepare is provided resolve then check for Promise
            if (typeof prepare == "function") {
                // call prepare passing context and a callback to ready
                const response = prepare.call(ctx, () => ctx.ready());
                // check if the response resolved to a promise
                if (Promise.resolve(response) === response) {

                    // finish with ready by attaching to promise resolution
                    response
                        // if the prepare Promise throws catch the err and continue (either via options.error or noop)
                        .catch((err) => {
                            // if error handling is present mark that this prepare method failed - but continue without it
                            ctx.error.call(ctx, err, { err: err, caller: ctx, method: "prepare" });
                        })
                        // ready either way
                        .then(() => ctx.ready());
                }
            } else if (prepare !== false) {
                // immediately ready (so long as we've not skipped auto-ready with prepare === false)
                ctx.ready();
            }
        }
    }

    // should be renamed .then and should also have a .catch function in here
    onReady(fn) {
        // take note of the ctx
        const ctx = this._ctx || this;
        // only call when queuedFn is fn
        if (typeof fn !== "function") {
            // throw when fn isnt a function
            throw(new TypeError("fn must be a function"));
        } else {
            
            // if we're not ready then record the fn for later - else call now
            return (ctx._isReady !== true ? ctx._queuedFns.push(fn) : fn.call(ctx));
        }
    }

    ready() {
        // take note of the ctx
        const ctx = this._ctx || this;
        // mark as transitioning to isReady
        ctx._isReady = null;
        // check if isReady was nulled
        if (!ctx._isSuspended) {
            // ready run through queued methods
            while (ctx._queuedFns.length > 0) {
                // splice each fn from the list and call
                let fn = ctx._queuedFns.splice(0, 1)[0];
                // call the function in this context
                fn.call(ctx);
            }
            // mark as ready from the top down
            ctx._isReady = true;
        }
    }

    // return a signiture denoting Preparable instance on toString
    toString() {
        
        // type given to Preparable instance
        return "[object Preparable]";
    }
}