# freo.js - [F]unctional [Re]active [O]bject Programming library

![CircleCI](https://img.shields.io/circleci/build/gh/gdixon/freo.js/master.svg?style=flat-square&token=49846bd8b00af4f81291462a08949912e7800aa0)
![Codecov](https://img.shields.io/codecov/c/github/gdixon/freo.js/master.svg?style=flat-square&token=KVDEN7HWQS)
![Bundled size](https://img.badgesize.io/https://unpkg.com/@gdixon/freo/freo.bundle.js?label=bundled&style=flat-square)
![NPM Version](https://img.shields.io/npm/v/@gdixon/freo?label=version&style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?label=license&style=flat-square)

## Preamble

Freo is a module library for creating reactive data-stores/streams intended to be used as a global-store, where a single source of truth controls the whole interface in interconnected ways, it introduces the concepts of ```Adapter``` and ```Adaptable-like``` to augment the ```Observer pattern``` with stateful properties and boundaries, and offers several ```Adapters``` and ```Adaptable-like``` implementations to make working with a changing data-source easier to manage and reason about.

## Detailed Introduction

Freo enables the use of Functional Reactive Programming (FRP) principles over the top of (some) ordinary javascript primitives by extending the ```Observer Pattern``` with stateful properties, Freo itself isn't functional, but it is reactive. It acts as a wrapper around a data-store/source allowing ```Adapters``` access to a change-stream, the ```StreamAdapter``` module is responsible for bridging the gap between Freo and FRP, by publishing a non-functional change-stream to a functional one.

If this is the first time you're hearing the term FRP then [this link*](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) provides a great introduction to Reactive Programming (written by [Staltz]() - the author of xstream and cycle.js - * note that what's being described within relates to an old version of ```RxJS```, but most of the ideas still apply and they loosely apply to [```@gdixon/fre```](https://github.co.uk/gdixon/fre.js) too (which this library depends on)), if you are familiar with FRP, ```RxJS``` or ```@gdixon/fre```, then put simply: Freo offers an alternative to ```flatMapping``` over ```Observable-Observables``` when working against a changing (optionally nested) data-source, it works by treating sets, deletes and transactions as ```Publishers``` on a global stream, which is then ```filtered``` and ```multicast``` to efficiently reduce the number of streams we need to create when we want to watch any particular unit of state (and its descendants) and to regulate how those changes enter the change-stream.

### Whats the problem?

Nested objects or data-sources, have an inferred relationship, when we modify a nested property, a change has been made to every property in the object back to the root of it's store, this is best exemplified by immutable objects but for the purpose of a data-source/change-stream the same is true of mutable objects too, in order to be reactive to a nested change on a stream at any parent position, the parent(s) must be aware of the stream the child is emitting to or we must emit to a shared stream, without proper management, this can lead to mixed concerns and brittle code that is difficult to test.

### How does Freo help?

Freo introduces 4 new types of ```Subject-like``` entites; ```Adaptable```, ```Preparable```, ```Readable``` and ```Writable``` and a new ```Observer-like``` called ```Adapter```. 

The ```Subject-like``` entities could also be referred to as ```Adaptable-like``` (that is to say, all 4 are instances of ```Adaptable```) and they serve to split the source down into structured boundaries, the ```Adapters``` are registered against ```Adaptable-likes``` and are used to pull those disparate pieces back together, allowing for interdependency without having to explicitly control each intersection ourselves. ```Adapters``` can be used independently from the targets that they're registered against, further separating the data-control mechanisms from the data-stream procedures, allowing us to pass around limited access to the data-source by way of controlled streams.

Freo's ```Adaptable-likes``` and ```Adapters``` work in slightly different ways to the original ```Subject``` and ```Observer``` constructs and they don't extend from their base nor do they depend on ```Subscriptions``` or ```Subscribers``` (by default). Instead, they introduce a stateful boundary to the ```Observer pattern```, they allow for each (```Adaptable-like```/```Adapter```) to be ```.registered()``` and to hold state. This is useful in the context of a data-store because there should always be a single source of truth, which is inherently stateful. The rest of the implementation is very similar [to the classical FRP/RxJS approach], however each method has a slightly different signature to allow the ```Adapters``` to be context aware without resorting to saving local references to the target(s) that the ```Adapter``` is registered to, it should also be noted that although it might work, subscribing ```Observers```/```Operators``` directly to an ```Adaptable-like``` is not the intended use-case because of these discrepancies [but in some cases it might work].

### How does Freo work?

The basic premise behind Freo is as follows: 

- Produce a data-store by instantiating a new ```Writable``` instances feeding in a ```raw target``` (any supported primitive), a ```key``` (dot-delimited key pointing to a position in the raw target (it doesn't have to exist yet)) and a set of ```options``` (an object containing flags and additional methods):

    - Writable wraps the ```raw target``` and exposes; ```.set()```, ```.delete()``` and ```.transaction()```, so that properties  on the ```raw target``` can be altered by referencing nested positions with a ```key```, these operations are resolved and then notified to the registered ```Adapters``` via ```.next()``` such that the previous ```Adapter``` can alter the ```message``` before the next ```Adapter``` sees it. 

    - ```Writable``` extends ```Readable```, which provides methods for exposing the instance's ```keyed``` value from the ```raw target``` (```.raw()```, ```.valueOf()```, ```.toJSON()```, etc) as well as a ```.get()``` method to move from the current instance to a new instance holding; a desired ```key```, any additional ```options``` and always the same ```root target``` that the source holds (the ```root target``` is always the top ```Writable``` (or ```Readable```) instance that holds the ```raw target``` to give each child a shared reference to the same raw object that can be modified immutably without holding reference to any intermediary instances, which helps to avoid trapping references/leaking memory). 

    - ```Readable``` extends ```Preparable```, and allows for the registration/preparation procedure (described below) to be waited on via ```.onReady()```: passing ```.onReady()``` a function will enqueue it to be called when the instance moves into ```._isReady``` state. ```Preparable``` also exposes a ```.ready()``` method, which is used internally by ```Readable```/```Writable``` to set the ```._isReady``` state and to flush the queue, as well as a ```.prepare()``` method (which is also called internally by ```Readable```/```Writable```) which will take an (optional) function supplied in the instances ```options``` and call it before calling ```.ready()```, this function might return a ```Promise```, and if it does, the ```.ready()``` call is chained allowing for a target to be asynchronously prepared (such as when we need to get the initial state from a server).

    - ```Preparable``` extends ```Adaptable```, which gives us ```Subject``` like properties (```.subscribe()```, ```.next()```, ```.error()```, ```.complete()``` and ```.unsubscribe()```) as well as a ```.register()``` method. 
    
        - Calling ```.register()``` is what initiates the whole start-up (and happens during construct when we create a new ```Readable```/```Writable``` instance), it runs through the supplied ```Adapters``` and calls ```.register()``` on each, passing in the current target. 
        
        - An ```Adapters``` ```.register()``` method might return a ```Promise```, and if it does, any Adapters that follow must wait for the ```Promise``` to ```.resolve()``` before continuing. 
 
        - Once all ```Adapters``` are registered the ```.prepare()``` method is called to finalise the preparation, once resolved it will call ```.ready()```, which calls any functions queued via ```.onReady()``` in FIFO order.

- ```Adapters``` will receive the ```.next()```/```.error()```/```.complete()``` and ```.unsubscribe()``` calls issued to any instance that they're registered against much like a ```Subject```/```Observer```, the control mechanism also follows the example set by ```Subjects```; ```.complete()``` marks us as ```.isStopped``` and ```.unsubscribe()``` marks ```.closed``` and ```.isStopped``` \- however Freo gives us slightly more control over how and when we enter those states, enabling us to run the method within the context of a single target without closing the connection to other targets.

### How can we use Freo in a functionally reactive way?

As stated before, Freo itself isn't functional, nearly every operation in Freo carries side-effects. We can however bridge the gap and produce a functionally-reactive stream by subscribing a ```StreamAdapter``` to a ```Readable/Writable``` instance; on register, a method (```.stream()```) is added to the target instance, which when invoked will return a true ```Subject-like``` that points to the targets ```key``` position on the ```StreamAdapter``` instance's stream. 

The ```StreamAdapter``` works against a single root ```Subject```/```BehaviourSubject``` (held against the ```Adapter```) and ```multicasts``` inferred relationships using ```ShareReplay``` and ```filter```, such that each property in an object or member in an array has it's own (efficient) stream that sources it's events from it's parent, each stream can be controlled in isolation and additional ```StreamAdapters``` can be applied at any time and in any position to further isolate events (and to control the complete/unsubscribe procedure(s)), this allows for unrelated parts to never need to know about each other, components can depend on the change-stream rather than the data-source, leading to code that's fully testable in isolation, but completely interdependent in practice. At its base, the stream is absorbing ```.next()``` messages in the form of objects which detail the operation (```{key:*, method:*, value:*, ...}```) but by default subscribing to a ```StreamAdapter``` that is target aware will bind a value-stream mapped from the target's ```key``` position in the ```raw target``` object, if we wanted access to the raw stream we can either pass a flag to the targets ```.stream()``` method (```.stream(true)```), or call the ```StreamAdapter``` instance's ```.stream()``` method without passing in a target.

## Getting Started

```
npm install @gdixon/freo --save
```

### Constructing a global store backed by a ServiceWorker to Sync changes between connected tabs

Utilising Writable, Sync (a singleton constructed from the SyncAdapter) and StreamAdapter:

```
    // Construct a single Writable instance to act as global store...
    import { Writable } from "@gdixon/freo";

    // Associate a singleton of the SyncAdapter to sync all data coms from all connected tabs (via a ServiceWorker)
    import { Sync } from "@gdixon/freo/adapter";

    // Associate the StreamAdapter to build a Fre compatible BeahviourSubject-Stream
    import { StreamAdapter } from "@gdixon/freo/adapter";

    // Construct the Writable and register the Adapter's
    // * note - if this was the nth+1 time we used the SyncAdapter's instance against a root level Writable it would replace
    //          the given target ({}) with the target held against the Adapter instance inorder to share the worker connection
    //          and global root target
    const store = new Writable({}, "", {
        // working the source as an immutable object is optional
        immutable: true,
        // provide all adapters we want associated with the source
        adapters: [
            // associate an instance of the StreamAdapter
            new StreamAdapter(),
            // associate the Sync singleton to subvert the root
            {
                adapter: Sync,
                options: {
                    // set the control scope for the service worker
                    scope: "./",
                    // pass the filename for the serviceWorker we want to load
                    filename: "publically-accessable-and-relatively-scoped-serviceWorker-file-that-imports-worker-from-@gdixon/freo/worker.js"
                }
            }
        ],
        // prepare is called as soon as the worker is .ready and the Writable has received ServiceWorkers state
        prepare: function () {

            // return a Promise -> will have writable.ready chained to it so that resolve sets .isReady and runs through enqueued fns
            return new Promise((resolve) => {
                // if the ServiceWorker holds no data...
                if (Object.keys(this.raw(true)).length === 0) {
                    // carry out a set to deliver initial payload (this could be a fetch request which would justify this Promise)
                    this.set({
                        a:{
                            b: 1
                        }
                    });
                }
                // resolve the promise
                resolve(this);
            });
        },
    });

    // when subscribed to this stream the connected Observer would be invoked with every message to every key and would 
    // provide the whole source object as message 
    // (* note that conventions suggest we suffix our stream instances with a $ sign to label them as Observable)
    const store$ = store.stream();

    // after the state has been prepared...
    store.onReady(function () {
        // collect the a.b entry
        const ab = this.get("a.b");
        // construct a stream against the position 
        const ab$ = ab.stream();
        // subscribe to the stream logging all messages
        ab$.subscribe((value) => console.log(value)); 
        // ... later modify the source ...
        ab.set(2);
        ab.set("string");
        ab.delete();
        ab.set({"c": 1});
        ab.set(4);
        // * note that every set/delete/transaction which successfully writes data will return an obj with an undo method to revert the changes
        const operation = ab.transaction(function() {
            this.set(5);
            console.log(ab.raw()); // still 4
        });
        // undo the transaction
        operation.undo();
    });

    /*
        logs (on first load):
        $ 1
        $ 2
        $ "string"
        $ undefined
        $ {"c": 1}
        $ 4
        $ 4
        $ 5
        $ 4

        logs (after refresh):
        $ 4
        $ 2
        $ "string"
        $ undefined
        $ {"c": 1}
        $ 4
        $ 4
        $ 5
        $ 4
    */
```

## List of Freo's modules

### <a name="freo"></a>@gdixon/freo

- Adaptable
- Preparable
- Readable
- Writable

### <a name="utility"></a>@gdixon/freo/utility

- clone
- merge
- join
- equal
- isObject
- isConstructor
- length
- typeOf
- toArray
- matchKey
- hasDefinition
- valueAt
- prepareMeta
- getValueAt
- setValueAt
- stream
- getType
- array
- object
- arrayBuffer
- date
- bool
- float
- integer
- string
- castArray
- castObject
- castArrayBuffer
- castDate
- castBool
- castFloat
- castInteger
- castString

### <a name="extension"></a>@gdixon/freo/adapter

- Adapter
- CacheAdapter
- ChangesAdapter
- ErrorAdapter
- GroupAdapter
- HistoryAdapter
- MessageAdapter
- StreamAdapter
- SyncAdapter </br>
    - The SyncAdapter is also exported as a singleton (```Sync```) to allow for the serviceWorker instance to be shared.
- TypeAdapter

### <a name="worker"></a>@gdixon/freo/worker

```
    // Load the worker inside a ServiceWorker via require (changes to the worker.js file will trigger clients to re-register)
    require("@gdixon/freo/worker.js");
```
or
```
    // Import the worker inside a ServiceWorker via importScript (changes to the worker.js file will NOT trigger clients to re-register)
    importScript("./worker.js");
```

## Testing

```
npm run test[:watch]
```

## Coverage

```
npm run coverage[:watch]
```

## Lint

```
npm run lint[:fix]
```

## Builds (cjs/es5/es2015 and bundles to freo.bundle.js)

```
npm run build
```

## Versioning

- We use [SemVer](http://semver.org/) for versioning. For available versions, see the [tags on this repository](https://github.com/gdixon/freo.js/tags).

## Contributors

- **Graham Dixon** - *Initial work* - [GDixon](https://github.com/GDixon)

  See also the list of [contributors](https://github.com/gdixon/freo.js/CONTRIBUTORS.md) who participated in this project.

## License

- This project is licensed under the MIT License - see the [license](https://github.com/gdixon/freo.js/LICENSE) file for details

## Acknowledgements

- [RxJS](https://github.com/ReactiveX/rxjs) - A reactive programming library for JavaScript (with thanks to [Ben Lesh](https://github.com/benlesh) and all [RxJS contributors](https://github.com/ReactiveX/rxjs/graphs/contributors))

