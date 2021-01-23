// import a writable data store to hold the single state object
import { Writable } from "../../writable.js";

// theres no reason this couldnt be a class here? Then I could extend just the command section to support more usecases?

// protect context with immediately invoked function expression (iife)
(function () {

    // associate the lead client on registers and unloads
    let leadClient = false;

    // - import Store via commonjs/esmodule (not importScript) then create an instance
    // -- this is a synced copy of the Store presented to the clients, however this store cannot be Observed
    // -- it will live as long as the serviceWorker does and is fully managed by any of the connected clients via MessageChannels
    const store = new Writable({});

    // post message to every other listener
    const sendMessage = function (from, message) {
        // if we let sendMessage do a claim then we ensure all clients are under this notify chain
        self.clients.claim().then(function () {
            // match the clients and only message if client isnt the originator of the message
            self.clients.matchAll().then(function (clients) {
                // send to every client except "from"
                clients.forEach(function (client) {
                    // macth against the id as the instances will be different
                    if (client.id != from.id) client.postMessage(message);
                });
            });
        });
    };

    // On registration take claim of the clients and nominate a leadClient
    self.addEventListener("install", function () {
        // force immediate take over
        self.skipWaiting();
    });

    // On registration take claim of the clients and nominate a leadClient
    self.addEventListener("activate", function (event) {

        // claim the clients nominate a lead and postMessage to all stating activation is complete
        event.waitUntil(self.clients.claim().then(function () {

            // after claiming is complete, send a message to each of the controlled pages letting it know that it's active.
            return self.clients.matchAll().then(function (clients) {

                // wait untill all messages are sent...
                return Promise.all(clients.map(function (client) {
                    // if we dont have a lead client yet - nominate the first in the list
                    if (!leadClient) {
                        // new lead client
                        leadClient = client;
                    }

                    // activation occured notify the client
                    return client.postMessage("activated");
                }));
            });
        }));
    });

    // use messages to get and keep Freo state in sync in all locations - ServiceWorker bridges communications between all clients
    self.addEventListener("message", function (event) {
        // given a command carry out an action and return a response to messaging client and all other clients (if appropriate)
        if (event.data && event.data.command == "all") {
            // reply with the cache
            event.ports[0].postMessage({
                error: null,
                data: store.raw(true),
            });
        } else if (event.data && event.data.command == "get") {
            // reply with the cache
            event.ports[0].postMessage({
                error: null,
                data: store.get(event.data.key).raw()
            });
        } else if (event.data && event.data.command == "isLead") {
            // check if the lead is still registered (if its not elect this client) otherwise check if this client isLead
            self.clients.matchAll().then(function (clients) {
                // match only the leader from the connected clients
                const discovered = clients.map(function (client) {

                    // if we're on the leader client return its id
                    return (leadClient.id === client.id ? client.id : false);
                }).filter(function (v) {

                    // include only valid clients
                    return v;
                });
                // if there are no matches then elect the source of the event as leader
                if (discovered.length === 0) leadClient = event.source;
                // reply with the cache
                event.ports[0].postMessage({
                    error: null,
                    data: (leadClient.id == event.source.id),
                    lead: (leadClient.id)
                });
            });
        } else if (event.data && event.data.command == "dropLead") {
            // drop the current leader if it matches the event.source
            self.clients.matchAll().then(function (clients) {
                // iterate connected clients and nominate a new leader
                clients.forEach(function (client) {
                    // ellect new leader to take the event.source.id's place
                    if (leadClient.id == event.source.id && client.id != event.source.id) {
                        // set the leadClient internally
                        leadClient = client;
                        // alert the client that its now in the leader role
                        client.postMessage("takeLead");
                    }
                });
            });
            // respond to activavte clean-up
            event.ports[0].postMessage({
                error: null,
                data: true
            });
        } else if (event.data && event.data.command == "readMessage" && event.data.message) {
            // auto an empty response
            let res = undefined;
            // get the keyed item
            const keyed = store.get("~" + event.data.message.k);
            // carry out the internal update notification provided by freo
            if (event.data.message.m === "set") {
                // sets the data to match the message data
                keyed.set(event.data.message.n, { creationMaxDepth: -1, replaceRoot: true });
                // reference the raw value after setting to notify the set was successful
                res = keyed.raw(true);
            } else if (event.data.message.m == "delete" ) {
                // delete the reference at keyed position
                keyed.delete({ creationMaxDepth: -1, replaceRoot: true });
                // get a clone of keyed ref before delete return that so we know what was deleted
                res = null;
            }
            // only if the command was met here...
            if (typeof res !== "undefined" || res === null) {
                // post to all others with the message we received
                event.ports[0].postMessage({
                    error: null,
                    // send the known given elements through...
                    data: {
                        m: event.data.message.m,
                        k: event.data.message.k,
                        n: event.data.message.n
                    }
                });
                // send message to other tabs
                sendMessage(event.source, event.data.message);
            } else {
                // respond to misses with a generic error
                event.ports[0].postMessage({
                    error: "400: bad request",
                    data: false
                });
            }
        } else {
            // respond to misses with a generic error
            event.ports[0].postMessage({
                error: "404: unrecognised command",
                data: false
            });
        }
    });
})();
