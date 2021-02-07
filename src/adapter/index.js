
// Base Adapter class - create new instances passing in register, message and error to produce light weight Adapters
export { Adapter } from "../internal/adapter.js";

// exports an Adapter to watch for error events
export { ErrorAdapter } from "../internal/adapter/error/adapter.js";

// exports an Adapter to alter/act-upon the message in sequence
export { MessageAdapter } from "../internal/adapter/message/adapter.js";

// exports a singleton of the SyncAdapter to be used as an Adapter against Writable (only Writable)
export { Sync } from "../internal/adapter/sync/sync.js";
// exports the registration procedure so consumer can define their own singleton by extending SyncAdapter
export { SyncAdapter } from "../internal/adapter/sync/adapter.js";

// exports MulticastAdapter to wrap multiple Adapters together into one payload
export { GroupAdapter } from "../internal/adapter/group/adapter.js";

// exports ChangedAdapter to record only the changes made under a given target
export { ChangesAdapter } from "../internal/adapter/changes/adapter.js";

// exports CachedAdapter to record and retrieve reference to every value touched during the lifetime of an instance
export { CacheAdapter } from "../internal/adapter/cache/adapter.js";

// exports historyAdapter to control the undo/redo log
export { HistoryAdapter } from "../internal/adapter/history/adapter.js";

// exports StreamAdapter to produce an Observable stream from the messages emitted when changes are made to the target
export { StreamAdapter } from "../internal/adapter/stream/adapter.js";

// exports TypeAdapter to associate a set of Types with a Writable instance
export { TypeAdapter } from "../internal/adapter/type/adapter.js";

