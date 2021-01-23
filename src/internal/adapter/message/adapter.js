// import the base Adapter
import { Adapter } from "../../adapter.js";

// simple Adapter to record undo/redo methods from registered instances inorder to replay history in correct order
export class MessageAdapter extends Adapter {

    constructor(next) {
        // construct the Adapter
        super();
        // forward messages via the given next method (expects next(message) signiture)
        this._next = (next && typeof next === "function" ? next : undefined);
    }

}
