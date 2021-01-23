// register Streamable instance against ServiceWorker 
import { SyncAdapter } from "./adapter.js";

// return the Registeration module as a Singleton
export const Sync = new SyncAdapter();