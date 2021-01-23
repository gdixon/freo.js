// import the base Adapter
import { Adapter } from "../../adapter.js";

// simple Adapter to record undo/redo methods from registered instances inorder to replay history in correct order
export class ErrorAdapter extends Adapter {

    constructor(error) {
        // construct the Adapter
        super();
        // forward given errors throught the given handler (expects error(err, details) signiture)
        this._error = (error && typeof error === "function" ? error : undefined);
    }

}
