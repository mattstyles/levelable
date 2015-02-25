# levelable [![Build Status](https://travis-ci.org/mattstyles/levelable.svg?branch=master)](https://travis-ci.org/mattstyles/levelable)

> Builds on sublevel and multilevel to expose a leveldb over the network

## Getting Started

```bash
npm i -S levelable
```

## Usage

Levelable is only just more than a convenience wrapper around multilevel so functionality its usage is the same.

Create the levelable object and use it to create a server:

```js
var level = Levelable({
    port: 3000,
    path: '/.db/leveller.db'
});

level.listen()
    .then( server => {
        // ...
    })
    .catch( onErr );
```

Then create a client connected to that server:
```js
level.connect()
    .then( con => {
        con.client.put( 'foo', { foo: 'bar' }, ( err ) => {
            con.client.get( 'foo', ( err, res ) => {
                // res = { foo: 'bar' }
            });
        });
    })
    .catch( onErr );
```

## ES6?

Yep, its written in ES6 and uses babel to transpile so if you’ve installed via `npm` then its good to go.

If you want to compile it yourself then its not much of a chore:

```
git clone git@github.com:mattstyles/levelable.git && cd $_
npm i
npm run build
```

There’s also a watch task if you’re in the mood to hack.

There’s a modest set of tests so feel free to hack away, use `npm test` to run those tests.

## API

### new Levelable( opts )

```
{
    port: <Number>::?optional,
    socket: <String>::?optional,
    db: <Level>::optional,
    path: <String>::?optional,
    sublevels: <Array:String>::optional
}
```

`port` the port to listen at, either _socket_ or _port_ is required
`socket` the socket address, either _socket_ or _port_ is required
`db` a leveldb instance, e.g. new Level() or Sublevel()
`path` the location on disk of the db, unnecessary if the db is passed in but is used to find the manifest
`sublevels` array of sublevels in the db

### levelable.sublevel( <String> )

Creates a new sublevel in the db.
Sublevel names are also stored in the db under the `meta` sublevel.

### levelable.listen()

Creates a server listening on the `port` or `socket` passed in at creation time.
Resolves with the `server` instance.

### levelable.connect( <String> )

Connects to the database on the `port` or `socket` passed in at creation time, optionally connecting to a specific sublevel.
Resolves with an object containing both the multilevel `client` and the raw `socket` it is connected with.

## Contributing

Feel free to hack away, there’s (at least) a couple of things that would be really beneficial if this module handled for you.

```
npm i
npm test
npm watch
```

## License

WTFPL
