
// import BehaviourSubject as default Observable type
import { BehaviourSubject, Subscriber } from "@gdixon/fre";

// allow for ShareReplay from parent stream
import { shareReplay } from "@gdixon/fre/operator";

// given both a flat key and a wildcarded key (a.a|b, a.*) check for a definition match (using regex)
import { matchKey } from "../../utility/matchKey.js";

// import the stream utility
import { stream } from "../../utility/stream.js";

// import the base Adapter
import { Readable } from "../../readable.js";

// import the base Adapter
import { Adapter } from "../../adapter.js";

// Adapter used to construct Streams from key positions on a targeted Readable/Writable instance
export class StreamAdapter extends Adapter {

    constructor(key, subjectFactory, bufferSize) {
        // construct the Adapter before assigning key prop
        super();
        // manually set the key which constrains the adapter on construct
        this._key = key;
        // assign subjectFactory else default to BehaviourSubject factory
        this._subjectFactory = subjectFactory || (() => new BehaviourSubject());
        // default to bufferSize of 1
        this._bufferSize = (typeof bufferSize === "undefined" ? 1 : bufferSize);
        // exposes length of the contained Subject
        Object.defineProperty(this, "length", {
            // assigned via getter
            get: function() {

                // return the length of the internally held observers
                return (this._subject ? this._subject.observer.observers.length : 0);
            }
        });
    }

    // register the instance and create a BehaviorSubject to contain the traffic
    _register(target) {
        // record the first key that we register against if key isnt set yet (this is the root entry position of the Observable)
        if (!this._registered && (this._registered = true) && typeof this._key == "undefined") this._key = target._key;
        // check for a match on the key before attempting the register (* note that completed streams will still be registered)
        if ((target instanceof Readable && (!target._key || matchKey(target._key, this._key).length || matchKey(this._key, target._key).length)) && !target._options.skipStreamAdapter) {
            // assign subject - if target is already Streamable then pull Observable from parent
            if (!this._observable) {
                // collect the parent StreamAdapter instance from the currently appointed instance
                if (target.stream && !this._parent) this._parent = target.stream({ returnAdapter: true });
                // check where the observable should be built - from the parent or factory...
                this._observable = newObservable.call(this);
                // pick up the unsubscribable Observable position
                this._subject = (this._parent ? this._observable._subject : new Subscriber(this._observable));
            }
            // assign a stream method to the instance --- target will stream against the last associated StreamAdapter
            target.stream = (options) => {

                // return a filtered stream for the given position (doesnt move from the targets ._key)
                return (options && options.returnAdapter ? this : this.stream(target, false, options));
            };
        }
    }

    // forward the given message through the stream
    _next(message) {
        // ensure the message isn't being skipped -- this happens with internal messages being set with undo/redo
        if (!message.skipMessage && this._observable && !this._parent) {
            // record the same action that the sender recorded - dont filter for key matches here because the stream will do it
            switch (message.method) {
            case "undo": case "redo":
                // ensure that the message holds a response if forwarding an undo/redo message
                if (message.response && message.response[(message.method == "undo" ? "redo" : "undo")]) {
                    // forward the message data through the roots observable
                    this._observable.next(message);
                }
                break;
            default:
                // forward the message data through the roots observable
                this._observable.next(message);

                break;
            }
        }

        // return the message unaltered
        return message;
    }

    // forward given errors to the root of the stream
    _error(err, details) {
        // ensure the message is a fresh set/delete
        if (err && this._subject && !(details && details.skipMessage)) {
            // port the error through the root of the observable
            this._subject.error(details || err);
        }
    }

    // forward completion to the root of the stream
    _complete(target) {
        // complete internals only when Observable is defined
        if (this._subject) {
            // if complete is called directly...
            if (!target || (target._key === this._key)) {
                // complete from root (drops all connections and moves to .isStopped state - future streams will emit the last message they recieved)
                this._subject.complete();
            } else {
                // complete the stream in desired location (position of the key on Observed stack)
                stream(this._observable, target, this._key, { 
                    raw: true, 
                    returnObserved: true, 
                    bufferSize: this._bufferSize 
                }).complete();
            }
        }
    }

    // unsusbcribe from the root of the Observable instance
    _unsubscribe(target) {
        // complete internals only when Observable is defined
        if (this._subject) {
            // if complete is called directly...
            if (!target || (target._key === this._key)) {
                // unsubscribe by way of the subscriber associated here (at root)
                this._subject.unsubscribe();
            } else {
                // drop the stream from the target (*note this isnt called if the subject is completed (because the _subject will be deleted))
                delete target.stream;
                
                // unsubscribe the stream in desired location (position of the key on Observed stack)
                stream(this._observable, target, this._key, { 
                    raw: true, 
                    returnObserved: true, 
                    bufferSize: this._bufferSize 
                }).unsubscribe();
            }
        }
    }

    // return a stream for the given target at key position (prefix with "~" to key from root) 
    // - if we're streaming directly from a target key will be false - if from the factory method/direct it can point to a key without a target
    // - raw allows for access to the raw message emitted by the Adaptable, if false then Stream will point to the value(s) held at key on the target 
    // - the option to have a !raw stream is disabled if we dont have a target to feed (such as when we produce a factory without supplying a target)
    stream(target, key, options) {
        // ensure the target can be read by the stream utility... (if we need to - fake a target by just providing _key)
        target = (key && target ? target.get(key, {skipAdapters: true}) : (target ? target : { _key: key || "" }));
        // construct a new observable for the subsequent streams
        if (!this._observable || (!this._parent && this._subject && this._subject.isStopped && this._subject.closed)) {
            // construct new observable and start again if the Observable is missing or stopped (complete or unsubscribed)
            this._observable = newObservable.call(this);
            // pick up the completable/unsubscribable Observable position
            this._subject = new Subscriber(this._observable);
        }

        // return a stream that sources its values from the given target based on events constrained by StreamAdapters _key
        return stream(this._observable, target, this._key, { ...options, bufferSize: this._bufferSize });
    }

    // return a factory to enable streams to be established succinctly against a key and a locked-in target
    // - like: 
    /*
    
        // create an Adapter that uses Subjects (no first message on subscribe)
        const streamAdapter = new StreamAdapter("", () => new Subject(), 0);
        
        // connect the adapter to a Writable (Adaptable instance)
        const target = new Writable({}, "", {adapters:[streamAdapter]});
        
        // create streams from the target and subscribe to them...
        const subscription1 = target.get("a.b.c").stream({raw: true}).subscribe(() => {});
        const subscription2 = target.get("a.b.c").stream().pipe(...);

        // or construct a streamFactory from the target that we just connected to...
        const streamFactory = streamAdapter.factory(target);

        // then create streams from the streamFactory and subscribe to them (this allows us to seperate the Stream(s) from the data-source)
        const subscription3 = streamFactory("a.b.c", {raw: true}).subscribe((message) => {...});
        const subscription4 = streamFactory("a.b.c").pipe(...); 

        // we can also enter the Observable stream without a target in place * note this stream is always {raw: true} as theres no target to gather values from
        const rawStreamFactory = streamAdapter.factory();
        
        // subscribe to the raw stream 
        rawStreamFactory("a.b.c").subscribe((message) => {...});
    
    */
    factory(target) {

        // return a function which will call out to stream - producing a filtered *Subject for the given key 
        return (key, options) => {

            // return a stream that sources its values from the given target based on events constrained by key
            return this.stream(target, key, (!target ? { ...options, raw: true } : options));
        };
    }

    // destroy() {
    //     // if the observable isnt stopped yet then unsubscribe
    //     if (!this._observable.isStopped) this.unsubscribe();
    //     // clear references that could cause leaks
    //     delete this._parent;
    //     delete this._subject;
    //     delete this._observable;
    // }
}

// construct a new Observable (that might be a subscriber set against a parent via a ConnectableObservable)
const newObservable = function() {
    // if this._parent is present then we need to register this new Subject onto the parents stream...
    if (!this._parent) {

        // return a new instance from the SubjectFactory
        return this._subjectFactory();
    } else {
        
        // places subscription to mount future subscriptions to...
        return this._parent
            // access the parents raw stream
            .stream(false, false, { raw: true })
            // then pipe a new ConnectableObservable to contain this Adapters subscribers
            .pipe(shareReplay(this._bufferSize, {
                // called on refCount
                onReconnect: (subject) => {
                    // record the subject to the parent instance if a new Subject is created
                    this._subject = subject;
                },
                onDisconnect: () => {
                    // delete the recorded subject
                    delete this._subject;
                }
            }));
    }
};