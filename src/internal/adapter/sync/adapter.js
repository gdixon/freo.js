// allow for this Base instance to be prepared (with onReady and ready)
import { Preparable } from "../../preparable.js";

// when the SyncAdapter is registered it hoist the targets source to global shared instance (SyncAdapter enforces a singleton on root)
import { Writable } from "../../writable.js";

// SyncAdapter extends Preparable and implements Adapter
export class SyncAdapter extends Preparable {

    constructor(adapters, prepare) {
        // construct the preparable - feeding only adapters and the preparation steps in (dont .register() because we do it on .load)
        super(false, adapters, false, prepare);
        // local state to record lead tab and pre-readied details
        this._lead = false;
        // record the error incase the user can correct
        this._error = false;
        // start as skip
        this._skipSendMessage = true;
    }

    register(target, adapter) {
        // check if this is Adapter registration or target registration...
        if (typeof target !== "function") {
            // ensure the target is supplied as a Writable
            if (target instanceof Writable) {
                // record the worker against the target
                target._worker = this;
                // reference the options from the adapter feed
                const options = adapter.options;
                // when resetting we should move back to !isReady state
                const isReset = (options && options.reset ? this.reset() : false);
                // set methods to onReady prior to resolving - only included in the options once...
                if (options && options.onReady) this.onReady(options.onReady), delete options.onReady;
                // if the root is already set...
                if (!this._source || (options && options.reset)) {

                    // return a promise to delay preparations on Writable until Worker registration is ready
                    return new Promise((resolve) => {
                        // mark as ready and load the ServiceWorker
                        const ready = () => {
                            // record the root target - this will be preserved and any other targets adapted with this Adapter will take this root
                            this._source = target;
                            // set/default the options set
                            this._options = options || {};
                            // then load the worker
                            this.load.call(this);
                            // when the worker has finished loading we can mark as registered
                            this.onReady(() => resolve());
                        };
                        // if reset is provided we want to drop any that are registered
                        if (options && options.reset) {
                            // reset will only be performed once per inclusion of reset: true
                            delete options.reset;
                            // attempt to reset the registrations in the navigator
                            if (typeof navigator !== "undefined" && navigator.serviceWorker) {
                                // ready after the old registrations are retired
                                isReset.then(() => ready());
                            } else {
                                // call to ready without resetting
                                ready();
                            }
                        } else {
                            // ready immediately if we're not resetting
                            ready();
                        }
                    });
                } else if (target === target._root && !target._options.transaction) {
                    // place adapter as we move through the sources adapters
                    let adapter = undefined;
                    // take a clone of the adapters
                    const adapters = this._source._adapters.concat();
                    // mark as a child of the root
                    target._target = this._source;
                    // delete the targets root and reassign
                    delete target._root;
                    // init against the new root
                    target.init();
                    // run through the roots adapters to associate the same adapter set
                    while(adapters.length && (adapter = adapters.splice(adapters.length-1, 1)[0])) {
                        // only subscribe if the adapter isnt subscribed yet
                        if (target._adapters.indexOf(adapter) == -1) {
                            // place before the given adapters so that root level superscede
                            target.subscribe(adapter, -1);
                        }
                    }
                    // check if we're ready yet - if we're not then suspend ready on the target until worker instance is ready
                    if (this._source._isReady === false) {
                        // mark the target as not ready
                        target._isSuspended = true;
                        // target is ready when source is ready...
                        this._source.onReady(() => {
                            // remove suspension
                            target._isSuspended = false;
                            // run through queued methods
                            target.ready();
                        });
                    }
                }
            } else {
                // resolve without readying - not connected if not Streamable
                throw (new TypeError("SyncAdapter can only be applied against a Writable instance"));
            }
        } else {
            // register constructor provided adapters into this instance (Writable.register)
            super.register(target, adapter);
        }
    }

    reset() {
        // clear the state back to defaults
        this._isReady = false; 
        // re-register the Adapters on the target
        this._isRegistered = false;
        // no leader if sw absent
        this._lead = false;
        // record the error incase the user can correct
        this._error = false;
        // skip sendMessage until set up finishes
        this._skipSendMessage = true;
        // when the worker is available attempt to unregister
        if (typeof navigator !== "undefined" && navigator.serviceWorker) {

            // drop the registered serviceWorkers
            return navigator.serviceWorker.getRegistrations()
                // attempt to unregister the registration
                .then((registrations) => {
                    // unregister each of the registered workers (should only be one at a time if Adapters being used)
                    for (let registration of registrations) registration.unregister();
                })
                // record any errors thrown but continue regardless
                .catch((err) => this.error(err));
        }
    }

    load() {
        // when the window is defined register the serviceWorker
        if (typeof window !== "undefined") {
            // register the serviceWorker
            window.addEventListener("load", () => {
                // attempt to register the nominated worker - if we cant then fallback to skipSendMessage with an undefined lead
                try {
                    // attempt to register the worker against provided filename
                    navigator.serviceWorker.register(this._options.filename || "./worker.js", { scope: this._options.scope || "./" }).then(() => {
                        // adds an event listener to receive messages from the serviceWorker to be reflected inside the Freo instance
                        navigator.serviceWorker.addEventListener("message", this.receiveMessage.bind(this));
                        // allow for the serviceWorker to be replaced
                        navigator.serviceWorker.addEventListener("controllerchange", ({ target }) => {
                            // move to the currently active controller as defined at target.controller.active (serviceWorker skipsWaiting)
                            this.setController((target && target.controller ? target.controller : false));
                            // place the current data set to the new worker - this might be a race condition if the new page issues sendsMessage first?
                            this.sendMessage({ command: "readMessage", message: { m: "set", k: "", n: this._source.raw(true) } });
                        });

                        // register against any new serviceworker that takes over - if this throws we wont do ready until the catch later
                        return navigator.serviceWorker.ready
                            // bind init to this to ensure context - init (Promise) will run through connection routine and gather state before resolving (or reload the page)
                            .then(this.init.bind(this))
                            // after init we can attempt to mark as is ._isReady and process the queue
                            .then(() => {
                                // ready run through queued methods and start rendering documents...
                                this.register(() => this.prepare());
                            }).catch((err) => {
                                // Service Worker is not present but we can still use Freo without client sync (we just wont share any data)
                                this.catch(err);
                            });
                    }).catch((err) => {
                        // Service Worker is not present but we can still use Freo without client sync (we just wont share any data)
                        this.catch(err);
                    });
                } catch (err) {
                    // attempting to access the navigator threw
                    this.catch(err);
                }
            });
        } else {
            // cannot load without window present
            this.catch(new ReferenceError("window is not defined"));
        }
    }

    init(worker) {
        // register the given controller against the instant and if its present load in all the data
        if (worker && this.setController(worker.active)) {
            // check for leader on first load - this is side-effectee and doesnt need to be waited on
            this.sendMessage({ command: "isLead" }, true).then(this.leaderElection.bind(this));

            // get all the data and fill root then apply a subscriber to watch for changes -- tunnel all changes into the sw
            return this.sendMessage({ command: "all" }, true).then((res) => {
                // set the initial state into the source instance
                this._source.set(res.data, {meta: {skipSendMessage: true}, replaceRoot: true, creationMaxDepth: -1});
                // allow messages through from this point forward
                this._skipSendMessage = false;

                // chain through the res
                return res;
            });
        } else {
            // if sw isn't active then we need to reload the window to gain control of the worker (not sure we need this with skipWaiting? we should always be controlling)
            location.reload();
        }
    }

    // catch any errors and finish loading
    catch(err) {
        // no leader if sw absent
        this._lead = undefined;
        // prep again?
        this._isRegistered = false;
        // noop the sendMessage fn
        this._skipSendMessage = true;
        // record the error incase the user can correct
        this.error(err);
        // ready run through any queued methods (but dont prepare again because preparation has already been ran for all Adapters)
        this.ready();
    }

    error(err, details) {
        // if the details are ommitted this local
        if (this._source && !details) {
            // record the last error on the instance itself so we can always observer missing env details
            this._error = err;
            // send error through to the target (all targets will have an error handler in the options)
            this._source.error(err, { err: err, caller: this });
        }
    }

    next(message) {
        // record sets and deletes (only)
        if (!message.skipSendMessage && (message.method === "set" || message.method == "delete")) {
            // tunnel the message to the serviceWorker
            this.sendMessage({
                // instruct the sw to read this message
                command: "readMessage",
                // follow the stream message style
                message: {
                    m: message.method,
                    k: message.key,
                    n: message.given
                }
            });
        }
    }

    setController(controller) {

        // set and return the given controller
        return (this.controller = controller);
    }

    sendMessage(message, force) {

        // return a promise that resolves when the sw posts on the messageChannel
        return ((!this._skipSendMessage || force) && this.controller && this.controller.postMessage && message && !message.skipSendMessage ?
            // return a promise that carries the response of the call to controller
            new Promise((resolve, reject) => {
                // create a channel to spy the message via
                var messageChannel = new MessageChannel();
                // when a message is received pass the event to the outer Promise
                messageChannel.port1.onmessage = (event) => {
                    // resolve if no error body present
                    if (!event.data.error) resolve(event.data);
                    // otherwise reject
                    else reject(event.data.error);
                };

                // this sends the message data as well as transferring messageChannel.port2 to the service worker (for response)
                return this.controller.postMessage(message, [messageChannel.port2]);
            }) :
            // noop when the worker instance has no receiver (like in IE)
            new Promise((resolve) => resolve(false))
        );
    }

    receiveMessage(event) {
        // received message from the serviceWorker...
        if (event.data === "takeLead") {
            // take leadership...
            this.leaderElection({ data: true });
        } else if (event.data === "activated") {
            // check for leader on activated serviceWorker
            this.sendMessage({ command: "isLead" }).then(this.leaderElection.bind(this));
        } else {
            // run everything else through the command receiver
            this.receiveEventCommand(event);
        }
    }

    receiveEventCommand(event) {
        // make readable stream writable to merge changes - (this will convert ANY streamable into a Writable-streamable)
        const keyed = this._source.get("~" + event.data.k, { meta: { skipSendMessage: true }, replaceRoot: true, creationMaxDepth: -1});
        // absorb each event into the root entry - *note that creating a new Writable here will skip the Stream
        if (event && event.data && event.data.m === "set") {
            // set new values emmited by the worker... (assign skipSendMessage to the internal notify)
            // - * allowing replaceRoot and no creationMaxDepth ensures that whatever was set to the ServiceWorker is copied over
            keyed.set(event.data.n);
        } else if (event && event.data.m == "delete") {
            // get the keyed item before calling to delete
            keyed.delete();
        }
    }

    leaderElection(res) {
        // leaderElection called with response from promise state is inside .data
        if (res.data === true) {
            // register the lead
            this._lead = true;
            // taking lead - invoke option defined event callback
            if (this._options.onTakeLead) this._options.onTakeLead.call(this);
            // when we leave the page drop leadership role (if we're still in it)
            if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("beforeunload", () => {
                // when we are the leader...
                if (this._lead && this._lead !== "none" && !(this._lead = false)) {
                    // call to dropLead
                    if (this._options.onDropLead) this._options.onDropLead.call(this);
                    // drop this tab as the lead
                    this.sendMessage({ command: "dropLead" });
                }
            });
        } else if (this._lead && !(this._lead = false) && this._options.onDropLead) {
            // call out to dropLead if leader changed
            this._options.onDropLead.call(this);
        }
    }
}