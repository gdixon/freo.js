// deep shallow merge left on provided ...args using concat to place new items
import { join } from "./utility/join.js";

// check if provided Adapters are built constructs or not
import { isConstructor } from "./utility/isConstructor.js";

// import the Adapters Subscriber wrap
// import { Subscriber } from "./subscriber.js";

// wait on the parent then register Adapters against the instance to adapt the instance/messages/errors
// - an Adapter is like an Observer but follows a (register, next, error, complete, unsubscribe) signiture
// - an Adapter could be registered to many Adaptables
// - an Adaptable could be registered as an Adapter
// - registering an Adapter to an Adaptable should alter or extend its (the Adaptables) behaviour in some way
// - an Adaptables next/error stream is emitted to each Adapter in sequence and can be altered at any stage
export class Adaptable {

    constructor(parent, adapters, ready, callback) {
        // mark context
        let ctx = this;
        // mark open/closed state
        this.closed = false;
        this.isStopped = false;
        // copy each adapter over and into the adapters store on subscribe
        this._adapters = [];
        // combine the given adapters with the parents (*note that Readables skip this as they feed a full set)
        adapters = (parent && parent._adapters ? join([], parent._adapters, adapters, true) : (adapters || []));
        // check ctx for adaptable
        const checkCtx = (ctx) => {
            // check if ctx resolves to a promise
            if (Promise.resolve(ctx) == ctx) {
                // set _ctx as innerCtx is different from this
                return ctx.then((innerCtx) => {
                    
                    // record innerCtx
                    return checkCtx(innerCtx);
                });
            } else {

                // mark the context into the instance if its different so that Preparable can adapt from ctx
                return (ctx !== this && ctx instanceof Adaptable ? (this._ctx = ctx) : this);
            }
        };
        // move the adaptations of this instance onto the prep of parent (if parent is Preparable - otherwise immediatly register Adapters)
        if (parent && ready && parent._isReady !== null && typeof parent.onReady == "function") {
            // register when the parent is ready (if this happens synchronously then ctx might be replaced)
            parent.onReady(() => {
                // check for alternative ctx after registering - this only might be async)
                checkCtx(this.register(callback, adapters));
            }); 
        } else if (ready) {
            // register now
            ctx = this.register(callback, adapters);
        } else {
            // if we're registering later just hold the adapters
            this._adapters = adapters;
        }
        // if ctx resolves to a promise then check _ctx placement
        if (Promise.resolve(ctx) === ctx) {
            // store the ctx into the instance and register the promise so that we can wait for completion
            this._registration = checkCtx(ctx);
        } else if (ctx !== this && ctx instanceof Adaptable) {
            
            // return the alternative instance if available and Adaptable
            return this._ctx = ctx;
        }
    }

    // this is named this way so that Adaptables already fit the Adapter signiture but this is equivalent of a pipe call on Observable but with optional 
    // Async registrations and a callback - register any adapters before proceeding with the callback (adapters.register can optionally return a Promise)
    register(callback, adapters, onlyNew) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // pull adapters and attempt to register each (passing any errors through to the error processor)
        if (onlyNew || (!ctx._isRegistered && !!(ctx._isRegistered = true))) {
            // clear the stored and trust new set?
            if (!onlyNew && adapters) ctx._adapting = adapters, ctx._adapters = [];
            // pick up the local set only if we're not presenting any new ones
            adapters = (!adapters && ctx._adapters ? ctx._adapters : adapters);
            // check for adapters and apply to all in list to the instance (before ready)
            if (adapters && adapters.length > 0) {
                // recursively pipe the adapters over the instance
                const pipeAdapters = (pipeCtx, adapters) => {
                    // mutate
                    adapters = adapters.concat();
                    // iterate the adapters and process
                    while (adapters && adapters.length) {
                        // take the first adapter
                        const adapter = adapters.shift();
                        // check for synchronous adapters that resolve immediately (if we're not adapting new adapters then stop recording)
                        const resolved = ctx.subscribe(adapter, (ctx._adapting ? undefined : !!onlyNew));
                        // if the response is a promise then delay the registration of the rest...
                        if (Promise.resolve(resolved) === resolved) {
                            // record copy of adapters
                            const ads = adapters.concat();
                            // after resolution resolve the rest
                            pipeCtx = resolved.then((innerCtx) => {
                                // trace from the given innerCtx
                                let pipeCtx = innerCtx;
                                // process the rest of the queue asynchronously
                                innerCtx = pipeAdapters(pipeCtx, ads);
                                // check from promise as result of pipe
                                if (Promise.resolve(innerCtx) == innerCtx) {

                                    // return promise so that we can wait on resolution
                                    return innerCtx.then((promiseCtx) => {

                                        // if the promisCtx is adaptable return that as ctx
                                        return (promiseCtx instanceof Adaptable && promiseCtx !== pipeCtx ? promiseCtx : pipeCtx);
                                    });
                                } else {

                                    // finally return the ctx
                                    return (innerCtx instanceof Adaptable && innerCtx !== pipeCtx ? innerCtx : pipeCtx);
                                }
                            });
                            // stop processing synchronously
                            adapters.length = 0;
                        } else if (resolved instanceof Adaptable) {
                            // move focus (* note that if we're moving ctx focus we should make sure to associate the old adapters to the new instance)
                            pipeCtx = resolved;
                        }
                    }

                    // return the ctx;
                    return pipeCtx;
                };
                // map/reduce over a shallow copy of the adapters and register in sequence
                const pipeCtx = pipeAdapters(this, adapters.concat());
                // run prepare after adapters are registered (asynchronous)
                if (Promise.resolve(pipeCtx) === pipeCtx) {
                    
                    // wait until all adapters are ready
                    return pipeCtx.then((pipeCtx) => {
                        // clear the adapting set (everything is now registered)
                        if (pipeCtx && pipeCtx._adapting) delete pipeCtx._adapting;

                        // callback only on the outermost layer
                        return (typeof callback == "function" ? callback.call(pipeCtx) || pipeCtx : pipeCtx);
                    });
                } else {
                    // clear the adapting set (everything is now registered)
                    delete pipeCtx._adapting;

                    // prepare immediately (synchronous)
                    return (typeof callback == "function" ? callback.call(pipeCtx) || pipeCtx : pipeCtx);
                }
            } else {

                // no adapters -- run prepare now (synchronous)
                return (typeof callback == "function" ? callback() || ctx : true);
            }
        }
    }

    // register an adapter and report 
    subscribe(adapter, pos) {
        // fill the response by registering adapter
        let response = false;
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // make sure the Adapter is provided as a constructed entity
        adapter = (isConstructor(adapter) ? 
            // attempt to construct the provide adapter else attempt to construct contained adapter
            new adapter() : (isConstructor(adapter.adapter) ? 
                // place all properties back into the structure and construct contained adapter with args
                { ...adapter, adapter: new adapter.adapter(...(adapter.args || [])) } : adapter
            )
        );
        // check if the provided adapter can be used (if the adapter is set at .adapter then we skip checks...)
        if (!(adapter && (["register", "next", "error", "complete", "unsubscribe"].reduce((useable, method) => {

            // check if any of the used methods holds a function
            return (useable || typeof adapter[method] === "function");
        }, false) ||  adapter.adapter))) {
            // error when attempting to register adapter
            if (adapter) {
                // emit as error through the handler
                const err = new TypeError("adapter is incompatible");
                // record error through to currently assigned adapters/handlers? or should this be thrown somewhere else?
                ctx.error(err, { err: err, caller: ctx, method: "subscribe", adapter: adapter  });
            }
        } else {
            // record the adapter if its new to this instance
            if (ctx._adapters.indexOf(adapter) == -1 || pos === false) {
                // check if we're storing the adapter
                if (pos !== false) {
                    // place into position (if pos is a negative splice will insert n positions from the end)
                    if (!isNaN(pos)) {
                        // mutably place the adapter into adapters at given position (allows for negative or positive pos)
                        ctx._adapters.splice(pos, 0, adapter);
                    } else {
                        // or push to the end
                        ctx._adapters.push(adapter);
                    }
                }
                // attempt to resolve a response from the register fn on the adapter
                try {
                    // place the response of registering on to response and check for Promise
                    response = (adapter.register ?
                        // regsiter against the adapter directly
                        adapter.register(ctx, adapter) :
                        // regsiter against the contained adapter with options
                        adapter.adapter && adapter.adapter.register && adapter.adapter.register(ctx, adapter)
                    );
                    // response is a promise attach resolve to then
                    if (Promise.resolve(response) == response) {
                        // resolve after the returned promise
                        response = response
                            // make sure the ctx is exposed after each registration
                            .then((innerCtx) => (innerCtx instanceof Adaptable ? innerCtx : ctx))
                            // if the adapter throws catch the err and continue (either via options.error or noop)
                            .catch((err) => {
                                // if error handling is present mark that this adapter failed - but continue without it
                                ctx.error(err, { err: err, caller: ctx, method: "subscribe", adapter: adapter });
                            });
                    }
                } catch (err) {
                    // push error through currently registered handlers
                    ctx.error(err, {err: err, caller: ctx, method: "subscribe", adapter: adapter });
                }
                
                // return response (allows us to chain promises and replace the target (not implemented yet - we always revert back to this))
                return response;
            }
        }
    }

    // push message to each registered Adapter
    next(message) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // when in the stopped state no new messages should be pushed
        if (!ctx.isStopped) {
            // drop adapters as we move
            const adapters = ctx._adapters.concat();
            // record this instance as the sender if none set
            message.sender = (message.sender ? message.sender : ctx);
            // curry the message through
            while (adapters.length > 0 && message !== false) {
                // drop the first adapter and work the error through
                const adapter = adapters.shift();
                // check if the adapter is still in open state
                if (adapter.closed || (adapter.adapter && adapter.adapter.closed)) {
                    // drop the adapter from the _adapters record
                    const pos = ctx._adapters.indexOf(adapter);
                    // check for entry in adapters // if (pos !== -1)
                    ctx._adapters.splice(pos, 1);
                } else {
                    // record the last message
                    const lastMessage = message;
        
                    // chain the message through the adapters - if the handler doesnt return then stop handling
                    message = (adapter.next ? 
                        adapter.next(message) : 
                        (adapter.adapter && adapter.adapter.next && adapter.adapter.next(message))
                    ); 
                    // if message is undefined then we should restore it
                    if (typeof message == "undefined") message = lastMessage;
                }
            }
        }

        // incase we're being used in as an Adapter return the adapted message
        return message;
    }

    // push error to each registered Adapter
    error(err, details) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // pass error through handlers -- * note that Adapters & Adaptables dont complete on error (like Observers do)
        if (!ctx.isStopped) {
            // drop adapters as we move
            const adapters = ctx._adapters.concat();
            // curry the errors through
            while (adapters.length > 0 && err !== false) {
                // drop the first adapter and work the error through
                const adapter = adapters.shift();
                // record state of error incase adapter handler returns falsy
                const lastError = err;
                // chain the err through the adapters - if the error handler doesnt return then stop handling
                err = (adapter.error ? 
                    adapter.error(err, details) : 
                    (adapter.adapter && adapter.adapter.error && adapter.adapter.error(err, details))
                );
                // if error is undefined then we should restore it
                if (typeof err === "undefined") err = lastError;
            }
        }

        // incase we're being used in as an Adapter return the adapted err
        return err;
    }

    complete(single) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // complete once per invoke
        if (!ctx.isStopped) {
            // mark as stopped
            ctx.isStopped = (single ? ctx.isStopped : true);
            // check if the given is present
            const isPresent = (single && ctx._adapters.indexOf(single) !== -1);
            // unsub method - first checks for unsub as an immediate child of the adapter
            const complete = (adapter, single) => (adapter.complete ? adapter.complete(ctx, adapter, single) : (
                // then at nested adapter position
                adapter.adapter && adapter.adapter.complete && adapter.adapter.complete(ctx, adapter, single)
            ));
            // check if the adapter is present before unsubscribing directly
            if (isPresent) {
                // unsubscribe the given adapter
                complete(single);
            } else {
                // unsub method - first checks for unsub as an immediate child of the adapter
                ctx._adapters.concat().forEach((adapter) => (complete(adapter, single)));
            }
            // if the adapter wasnt provided then unsub all adapters - else just unsub the given
            if (!single) {
                // clear the adapters store;
                ctx._adapters = [];
            }
        }

        // allow the instance to be chained
        return ctx;
    }

    unsubscribe(single) {
        // mark ctx position to allow shallow redirects
        const ctx = this._ctx || this;
        // only perform unsubscribe once per invoke
        if (!ctx.closed) {
            // stop future calls (after this unsubscribe has been emitted if it wasnt sourced from a complete);
            ctx.closed = (ctx.isStopped || single ? ctx.closed : true);
            // always mark as stopped
            ctx.isStopped = (!single ? true : ctx.isStopped);
            // check if the given is present
            const isPresent = (single && ctx._adapters.indexOf(single) !== -1);
            // unsub method - first checks for unsub as an immediate child of the adapter
            const unsubscribe = (adapter, single) => (adapter.unsubscribe ? adapter.unsubscribe(ctx, adapter, single) : (
                // then at nested adapter position
                adapter.adapter && adapter.adapter.unsubscribe && adapter.adapter.unsubscribe(ctx, adapter, single)
            ));
            // check if the adapter is present before unsubscribing directly
            if (isPresent) {
                // unsubscribe the given adapter
                unsubscribe(single);
            } else {
                // unsub the given adapter from within the contained Adapters (if present)
                ctx._adapters.concat().forEach((adapter) => (unsubscribe(adapter, single)));
            }
            // if the adapter wasnt provided then unsub all adapters - else just unsub the given
            if (!single) {
                // clear the adapters store;
                ctx._adapters = [];
            }
        }

        // allow the instance to be chained
        return ctx;
    }

    // return a signiture denoting Adaptable instance on toString
    toString() {
        
        // type given to Adaptable instance
        return "[object Adaptable]";
    }
}