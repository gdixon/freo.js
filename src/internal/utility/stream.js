// load Fre operators to construct a filtered Subject that only has one Connection to Source
import { map, filter, shareReplay } from "@gdixon/fre/operator";

// escapement for regExp - using it to clean up the key before removing if we start on a descendent
import { escapeRegExp } from "./escapeRegExp.js";

// use matchKey from hasDefinition to allow a stream set-up with wildcard entries to emit if a matching keys' value changes 
// and to allow operations made against wildcard entries to hit literal matches
import { matchKey } from "./matchKey.js";

// each Freo instance might have an Observable attached 
// -- each observable should have a full chain built that filters messages based on key - to resemble the target.key position
export const stream = function (observable, target, keyPrefix, options) {
    // default the option set if not provided
    options = options || {};
    // check for raw
    const raw = (options.raw === true);
    // check for returnObserved flag
    const returnObserved = (options.returnObserved === true);
    // if no share adapter is given - default to 1 replay
    const bufferSize = (typeof options.bufferSize === "undefined" ? 1 : options.bufferSize);
    // allow for the keys filtering proceedure to be offset by the lead-in key (the target that was present when we built observable)
    if (!target && !raw) {
        // throw -- this isnt a state that should be entered...
        throw(new TypeError("cannot produce a value stream without a target"));
    } else {
        // track the full key as we move through from left to right
        let workingKey = keyPrefix || "";
        // any messages arriving on this stream for anything that doesnt fit the key will be nooped
        const prefixRegex = (keyPrefix ? new RegExp("^" + escapeRegExp(keyPrefix) + "\.?") : false);
        // if the key doesnt match the entry key then we can drop without touching the Observed/Observable
        if (!target || (target && typeof target._key !== "undefined" && (!keyPrefix || (keyPrefix && target._key.match(prefixRegex))))) {
            // get each key mentioned at the top (* note that keys will always be a minimum of .length == 1)
            const keys = (keyPrefix && target && target._key ? target._key.replace(prefixRegex, "") : target && target._key || "").split(".");
            // filter subscription to only messages on this key (creates a chain of observables with increasing exclusivity)
            observable.observed = observable.observed ? observable.observed : {};
            // trace the currently associated filter from the key (done on each connect to revive/realign retired streams)
            const liveObservable = (key) => {

                // split the current key position and reduce to the correct filter (no creating)
                return (keyPrefix ? key.replace(prefixRegex, "") : key).split(".").reduce((prev, k) => {

                    // returns false if any in the chain is absent
                    return (prev && prev.filters && prev.filters[k]);
                }, observable.observed);
            };
            // place each of the keys mentioned in the requested key into an object on a Subject (.filters -> .pipe(Share())) 
            // - reducing till we get final Observable we want to subscribe to
            const filtered = keys.reduce((prev, k) => {
                // move to the nested carr if present
                const carr = (prev && prev.target ? prev.target : prev);
                // trace the key (allows for either side to be empty (dot only added if both arnt))
                let innerKey = workingKey + (workingKey && k ? "." : "") + k;
                // allow next key to start from here
                workingKey = innerKey;
                // create the filters obj and the filter for the k
                if (!carr.filters || !carr.filters[k]) {
                    // check if we're at root
                    const isRoot = !(carr && carr.filter);
                    // construct a store for each filterObservable to limit the messages based on key
                    carr.filters = (carr.filters ? carr.filters : {});
                    // on update we need to pass the notif if anything before it is altered
                    carr.filters[k] = (!isRoot ? carr : observable).pipe(
                        // Filter prior to sharing (dont share using selector) so that the Filter is applied once
                        filter((message) => {
                            // check in all places for a match - stop checking if we match
                            const empties = (!message || !message.key || !innerKey);
                            // checks if the current working key/definition pointer is contained within the message.k
                            const matchLeft = (!empties && matchKey(message.key, innerKey));
                            // check that the left matches and has no gaps to the right-hand-side (doesnt matter if the left overlaps - that just means descendent)
                            const leftMatches = (matchLeft && matchLeft.length && matchLeft.lastIndexOf(undefined) !== matchLeft.length-1);
                            // check in the reverse direction for definition pointer on the messages.k and a sub match on the innerKey
                            const matchRight = (!empties && !(leftMatches) && matchKey(innerKey, message.key));
                            // check if the right matches
                            const rightMatches = (matchRight && matchRight.length && matchRight.lastIndexOf(undefined) !== matchRight.length-1);
                            // check if either of the two holds length
                            const matches = (!empties && (leftMatches || rightMatches));

                            // message fits if undf or undf key -- or if the key fits into message.k
                            return (empties || matches);
                        }),
                        // filters to only messages which match this key (or are empty to allow for behaviourSubjects to emit first message)
                        shareReplay({
                            // repeat the last message to similate behaviourSubject behaviour (this is ignored if the shareOperator is "share")
                            bufferSize: bufferSize,
                            // on reconnect switch to the most appropriate source/set the proper filter association
                            onReconnect: function () {
                                // grab the live trace of filters on the observed object
                                const live = liveObservable(innerKey);
                                // recording the live trace so that future instances can share this replay
                                if (!live) carr.filters[k] = this;

                                // return the live value (if present should point to an instance which replaced this Connectable instance)
                                return live;
                            },
                            // if the source is unsubscribed then this should be called
                            onDisconnect: function () {
                                // when the pipe is presently assigned (filter can withstand being deleted and restored by reaction to avoid accidental memory leaks)
                                delete carr.filters[k];
                            }
                        })
                    );
                }

                // retain reference to targets parent and key so that we can delete its reference after unsubscribing
                return { parent: carr, target: carr.filters[k], key: k };
            }, observable.observed);

            // return a stream to map to raw & to associate replay behaviour (working like BehaviourSubject)
            return (returnObserved === true ? filtered.target._subject : filtered.target.pipe(
                // map to the requested form over the top of the recorded shareReplay filter
                map((x) => {
                    // check if we're skipping the clone
                    const skipClone = (target && target._options && target._options.skipClone || target && target._options && target._options.immutable ? true : false);
                    // combine the target with the message
                    const withTarget = (raw && x && x.constructor == Object ? {...x, target: target, fromTarget: (target && target._root === x.sender._root)} : x);
                    // - raw stream supplies raw message as notified through StreamAdapter
                    // - else we return a value stream (of values set against the instance we called .stream against)
                    //   the value stream will only call .raw() once per message (Observers of the stream will receive the buffered content)
                    //   for every time we .stream from the instance 
                    return (raw ? withTarget : target.raw(skipClone));
                }),
                // final response is a shareReplay which connects to a map of the filtered raw/value stream
                shareReplay(bufferSize)
            ));
        }
    }
};
