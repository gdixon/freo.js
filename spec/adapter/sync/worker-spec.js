// polyfill the generator method if absent from runtime
import "core-js/stable";
import "regenerator-runtime/runtime"

// import chai for testing
import chai from 'chai';

// test subject (Preparable instance exposes ready, onReady, _isReady and _queuedFns)
import makeServiceWorkerEnv from 'service-worker-mock';

// set-up spec testing feature-set
describe("SyncWorker ~ from ~ freo/extension", function () {

    it("should keep record of current state and registered clients", async function () {
        // associate the sericeWorkerEnv
        global.self = makeServiceWorkerEnv();

        // import the worker with self global built
        require("../../../src/internal/adapter/sync/worker.js");

        // construct dummy clients
        const client1 = new self.Client("https://dummy.url/1");
        const client2 = new self.Client("https://dummy.url/2");
        
        // count the number of events received
        let eventsReceived = 0, triggered = 0, clients = [client1, client2];

        // connect the clients to the worker
        self.clients.clients.push(...clients);

        // install and await receipt
        await self.trigger('install');
        // activate and await receipt
        await self.trigger('activate');

        // incr on reciept
        client2.addEventListener("message", () => {
            // count the total number of events received
            eventsReceived++;
        });

        // send message to set value
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.eql({ m: "set", k: "a.b", n: 1 });
                }
            }], data: { command: "readMessage", message: { m: "set", k: "a.b", n: 1 } }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(1);

        // delete the message
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.eql({ m: "delete", k: "a.b", n: undefined });
                }
            }], data: { command: "readMessage", message: { m: "delete", k: "a.b", n: undefined } }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(2);

        // set the value again
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.eql({ m: "set", k: "a.b", n: 2 });
                }
            }], data: { command: "readMessage", message: { m: "set", k: "a.b", n: 2 } }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(3);

        // 404 message with bad command
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.error).to.equal("400: bad request");
                }
            }], data: { command: "readMessage", message: { m: "failtoread", k: "a.b", n: 2 } }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(4);

        // get all data currently set
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.eql({ a: { b: 2 } });
                }
            }], data: { command: "all" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(5);

        // get a single value for a key
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.eql(2);
                }
            }], data: { command: "get", key: "a.b" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(6);

        // expect takeLead to be granted
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.equal(true);
                }
            }], data: { command: "isLead" }
        })
        // expect event to have triggered
        chai.expect(triggered).to.equal(7);

        // expect dropLead to be granted
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.equal(true);
                }
            }], data: { command: "dropLead" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(8);

        // expect isLead to be false for client1
        await self.trigger("message", {
            source: client1, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.equal(false);
                }
            }], data: { command: "isLead" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(9);

        // check isLead on client2
        await self.trigger("message", {
            source: client2, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.equal(true);
                }
            }], data: { command: "isLead" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(10);

        // dropLead from client2
        await self.trigger("message", {
            source: client2, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.equal(true);
                }
            }], data: { command: "dropLead" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(11);

        // isLead is false for client2
        await self.trigger("message", {
            source: client2, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.equal(false);
                }
            }], data: { command: "isLead" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(12);

        // run an unknown command and expect 404
        await self.trigger("message", {
            source: client2, ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.error).to.equal("404: unrecognised command");
                }
            }], data: { command: "unknown command" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(13);

        // drop both clients from the self.clients.clients registry
        while(clients.length) {
            // drop each client and splice it from the self.clients.clients
            self.clients.clients.splice(self.clients.clients.indexOf(clients.pop()), 1);
        }

        // check is lead with a new client
        await self.trigger("message", {
            source: new self.Client("https://dummy.url/1"), ports: [{
                postMessage: function (response) {
                    // make sure the event was triggered
                    triggered++;
                    // expect the message to match
                    chai.expect(response.data).to.equal(true);
                }
            }], data: { command: "isLead" }
        });
        // expect event to have triggered
        chai.expect(triggered).to.equal(14);

        // expect to have received 5 events (service activated (*2) and all of the readMessages except for "failtoread" (*3))
        chai.expect(eventsReceived).to.equal(5);
    });

});