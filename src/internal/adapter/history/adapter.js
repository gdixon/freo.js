// create a subject on the root instance to sync all undo/redo actions between instances (undo here should undo there)
import { Async } from "@gdixon/fre/scheduler";

// given both a flat key and a wildcarded key (a.a|b, a.*) check for a definition match (using regex)
import { matchKey } from "../../utility/matchKey.js";

// import the base Adapter
import { Adapter } from "../../adapter.js";

// simple Adapter to record undo/redo methods from registered instances inorder to replay history in correct order
export class HistoryAdapter extends Adapter {

    constructor(bufferSize, windowTime, scheduler, methods) {
        // build the Adapter
        super();
        // hydrate values if provided as options object
        let args = (bufferSize && bufferSize.constructor === Object ? bufferSize : (windowTime && windowTime.constructor === Object ? windowTime : false));
        // hydrate values from optional options object...
        if (args) {
            // bufferSize might be provided as a number
            bufferSize = (typeof bufferSize === "number" ? bufferSize : args.bufferSize);
            // all other arguments are from args
            windowTime = args.windowTime;
            scheduler = args.scheduler;
            methods = args.methods;
        }
        // never exceed the bufferSize(+1) (on the left stack) - bufferLength will always be atleast one because we only shift right before pushing
        this._bufferSize = (typeof bufferSize !== "undefined" ? bufferSize : -1);
        // number in ms of when the buffered message should retire (if not already removed by bufferSize restraints)
        this._windowTime = windowTime;
        // place the provided scheduler into the options
        this._scheduler = scheduler || (typeof this._windowTime !== "undefined" ? Async : undefined);
        // instrument the targets that we register against using the following methods...
        this._methods = (methods && methods.constructor == Array ? methods.concat() : ["set", "delete", "undo", "redo"]);
        // collect alterations from all instances onto the left and right stacks (undo/redo)
        this._left = []; this._right = [];
        // exposes length for strings and arrays
        // this.length = new length(() => { return { length: this._left.length + this._right.length }; });     
        // exposes length for strings and arrays
        Object.defineProperty(this, "length", {
            // assigned via getter
            get: function() {

                // return the length of both buffers
                return (this._left.length + this._right.length);
            }
        });   
    }

    _register(target) {
        // record the first targets key so we can check if theyre covered in this history stack (only descendents/matches)
        if (!this._registered && (this._registered = true)) this._key = target._key;
    }

    _next(message) {
        // make sure the method is covered before absorbing message
        if (this._methods.indexOf(message.method) !== -1) {
            // check details for matching history items...
            if (message.origins !== this && !message.skipMessage && (matchKey(message.key, this._key).length || matchKey(this._key, message.key).length)) {
                // record the same action that the origins recorded
                switch (message.method) {
                case "undo":
                    // check if the message is contained in the redo call stack - record only if it is
                    this._left = processMessage.call(this, this._left, this._right, message);

                    break;
                case "redo":
                    // check buffers length and evict the first entry if we're over
                    if (this._bufferSize !== -1 && this._left.length - 1 >= this._bufferSize) this._left.shift();
                    // check if the message is contained in the redo call stack - record only if it is
                    this._right = processMessage.call(this, this._right, this._left, message);

                    break;
                default:
                    // push the undo method only when the value made changes to prev value
                    // if (message.response && message.response.undo) { // wont notify if no values are written
                    // check buffers length and evict the first entry if we're over
                    if (this._bufferSize !== -1 && this._left.length - 1 >= this._bufferSize) this._left.shift();
                    // push undo to the left
                    this._left.push(message.response);
                    // drop everything on the right - cant move back to it if left is altered
                    this._right.splice(0, this._right.length);
                    // only set clean up if windowTime is provided
                    scheduleRemoval.call(this, message.response, this._left);
                    // }

                    break;
                }
            }
        }

        // return the message unaltered
        return message;
    }

    _unsubscribe(target) {
        // if called directly or against an instance with an equal key to the root
        if (!target || (target._key == this._key)) {
            // clear the record
            this.clear();
        }
    }

    undo(options) {
        // default options
        options = options || {};
        // check from history on the left
        if (this._left.length > 0) {
            // collect the last action from the left
            const action = this._left.pop();
            // mark skip (this will send its own notification so that it can add an origin)
            options.skipMessage = { src: "hist/undo" };
            // undo the action
            const undo = action.undo(options, true);
            // record the undos unwrapped .redo action to the right
            this._right.push(undo);
            // post to the message channel to keep all subordinates/parents in sync
            action.target.next({
                origins: this,
                method: "undo",
                key: undo.key,
                action: action,
                response: undo,
                value: action.target.get(undo.key, {fullKey: true}).raw()
            });
            // only set clean up if windowTime is provided
            scheduleRemoval.call(this, undo, this._right);

            // return the undo method
            return undo;
        }
    }

    redo(options) {
        // default options
        options = options || {};
        // check for history on the right
        if (this._right.length > 0) {
            // collect the last undone action from the right
            const action = this._right.pop();
            // mark skip (this will send its own notification so that it can add an origin)
            options.skipMessage = { src: "hist/redo" };
            // redo the action
            const redo = action.redo(options);
            // record the redos unwrapped .undo action to the left
            this._left.push(redo);
            // post to the message channel to keep all subordinates/parents in sync
            action.target.next({
                origins: this,
                method: "redo",
                key: redo.key,
                action: action,
                response: redo,
                value: action.target.get(redo.key, {fullKey: true}).raw()
            });
            // only set clean up if windowTime is provided
            scheduleRemoval.call(this, redo, this._left);

            // return the redo method
            return redo;
        }
    }

    clear() {
        // drop actions on both sides
        this._left = [], this._right = [];
    }

}

// when a change is emitted on any branch this is the process that absorbs those changes into the history buffers
// - ** note that stack1 and stack2 can be either _left or _right -- depends on method = undo|redo
const processMessage = function(stack1, stack2, message) {
    // opposite method for success checking
    const opposite = (message.method == "redo" ? "undo" : "redo");
    // process the message 
    if (stack1.length && stack1.indexOf(message.action) !== -1) {
        // if we skip back to a random position - clear the positions on left that we skipped
        stack1 = stack1.splice(0, stack1.indexOf(message.action));
        // record the new right from action
        if (message.response && message.response[opposite]) stack2.push(message.response);
        // only set clean up if windowTime is provided
        if (message.response && message.response[opposite]) scheduleRemoval.call(this, message.response, stack2);
    } else {
        // clear the right whenever we push a new entry to the left
        if (message.method === "redo") stack1 = [];
        // push as new undo
        if (message.response && message.response[opposite]) stack2.push(message.response);
        // only set clean up if windowTime is provided
        if (message.response && message.response[opposite]) scheduleRemoval.call(this, message.response, stack2);
    }

    // return the left hand side (only side which might have changed ref)
    return stack1;
};

// when scheduler is present on the instance - then the value should be dropped after a windowTime occurance
const scheduleRemoval = function (action, from) {
    // only set clean up if windowTime is provided
    if (this._scheduler && this._scheduler.schedule && typeof this._windowTime !== "undefined") {
        // schedule the removal of the buffered message
        this._scheduler.schedule(() => {
            // check position of item
            const position = this._left.indexOf(action);
            // if the message is present splice it from the buffer
            if (position !== -1) from.splice(position, 1);
        }, true, this._windowTime);
    }
};
