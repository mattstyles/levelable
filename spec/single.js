/**
 * Tests running levelable in a single process
 */

var fs = require( 'fs' );

var Levelable = require( '../lib/index' );
var Level = require( 'level' );

var mkdirp = require( 'mkdirp' );
var del = require( 'del' );

var expect = require( 'chai' ).expect;

var dbpath = __dirname + '/.db/';


/**
 * Creating levelable should throw if no port or socket path is specified
 */
suite( 'Instantiating levelable', function() {
    var level, socketPath;

    setup( function() {
        level = null;
        socketPath = '/var/run/levelable.sock';
    });

    test( 'new Levelable() should throw with invalid parameters', function() {
        expect( function() {
            level = new Levelable();
        }).to.throw( Error );
    });

    test( 'new Levelable() should throw with invalid parameters', function() {
        expect( function() {
            level = new Levelable({});
        }).to.throw( Error );
    });

    test( 'Levelable should register the port to listen at when instantiated', function() {
        level = new Levelable({
            port: 3000
        });


        expect( level.location ).to.equal( 3000 );
    });

    test( 'Levelable should register the socket to listen at when instantiated', function() {
        level = new Levelable({
            socket: socketPath
        });

        expect( level.location ).to.equal( socketPath );
    });

});

/**
 * Test creating a db
 */
suite( 'Creating a server to access the db', function() {
    var levels = [];

    setup( function( done ) {
        levels = [];
        mkdirp( dbpath, done );
    });

    teardown( function( done ) {
        var closing = levels.map( function( level ) {
            return new Promise( ( resolve, reject ) => {
                level.rootDB.close( resolve );
            });
        });

        Promise.all( closing )
            .then( () => {
                del([ dbpath ], done );
            });

    });

    test( 'Server should start listening to the specified port', function( done ) {
        levels.push( new Levelable({
            port: 3000,
            path: dbpath + 'test.db'
        }));

        levels[ 0 ].listen()
            .then( function( server ) {
                expect( server.address().port ).to.equal( 3000 );
                server.close( done );
            });
    });


    test( 'Multiple servers should be created', function( done ) {
        levels.push( new Levelable({
            port: 3000,
            path: dbpath + 'test.db',
        }));

        levels.push( new Levelable({
            port: 3001,
            path: dbpath + 'test1.db',
        }));

        var tests = levels.map( function( level, index ) {
            return new Promise( ( resolve, reject ) => {
                setTimeout( () => {
                    level.listen()
                        .then( function( server ) {
                            expect( server ).to.exist;
                            server.close( resolve );
                        })
                        .catch( function( err ) {
                            reject( err );
                        });
                }, index * 200 );
            });
        });

        Promise.all( tests )
            .then( () => {
                done();
            })
            .catch( done );
    });

});


suite( 'Connect with a client', function() {
    var level = null;
    var server = null;
    var client = null;
    var socket = null;

    setup( function( done ) {
        mkdirp( dbpath, function() {
            level = new Levelable({
                port: 3000,
                path: dbpath + 'test.db'
            });
            level.listen()
                .then( ( s ) => {
                    server = s;
                    done();
                });
        });
    });

    teardown( function( done ) {
        if ( socket ) {
            socket.end();
        }
        setTimeout( function() {
            server.close( function() {
                client = null;
                socket = null;
                level.rootDB.close( function() {
                    del([ dbpath ], done );
                });
            });
        }, 500 );
    });

    test( 'Connecting resolves with socket and client objects', function( done ) {
        level.connect()
            .then( ( res ) => {
                expect( res.client ).to.exist;
                expect( res.socket ).to.exist;
                client = res.client;
                socket = res.socket;
                done();
            });
    });

    test( 'Expects that the client can put data', function( done ) {
        level.connect()
            .then( ( res ) => {
                client = res.client;
                socket = res.socket;
                expect( function() {
                    client.put( 'test', 'foo', function() {
                        done();
                    });
                }).to.not.throw( Error );
            });
    });

    test( 'Expects that the client can get data once put', function( done ) {
        level.connect()
            .then( ( res ) => {
                client = res.client;
                socket = res.socket;
                expect( function() {
                    client.put( 'test', 'foo', function() {
                        client.get( 'test', function( err, res ) {
                            expect( res ).to.equal( 'foo' );
                            done();
                        });
                    });
                }).to.not.throw( Error );
            });
    });
});



suite( 'Connecting to a remote db with a custom manifest', function() {
    var level = null;
    var server = null;
    var client = null;
    var socket = null;
    var manifest = JSON.parse( fs.readFileSync( __dirname + '/fixtures/manifest.json' ) );

    setup( function( done ) {
        mkdirp( dbpath, function() {
            level = new Levelable({
                port: 3000,
                path: dbpath + 'test.db',
                sublevels: [
                    'conf'
                ]
            });
            level.listen()
                .then( ( s ) => {
                    server = s;
                    done();
                });
        });
    });

    teardown( function( done ) {
        if ( socket ) {
            socket.end();
        }
        setTimeout( function() {
            server.close( function() {
                client = null;
                socket = null;
                level.rootDB.close( function() {
                    del([ dbpath ], done );
                });
            });
        }, 500 );
    });

    test( 'Expects to be able to use a custom manifest to access a sublevel', function( done ) {
        level.connect( 'conf', {
            manifest: manifest
        })
            .then( ( res ) => {
                client = res.client;
                socket = res.socket;
                expect( function() {
                    client.put( 'test', 'foo', function() {
                        client.get( 'test', function( err, res ) {
                            expect( res ).to.equal( 'foo' );
                            done();
                        });
                    });
                }).to.not.throw( Error );
            });
    });
});



suite( 'Connecting multiple remotes to a levelable process', function() {
    var levelMaster = null;
    var levelRemotes = [];
    var server = null;
    var manifest = JSON.parse( fs.readFileSync( __dirname + '/fixtures/manifest.json' ) );


    suiteSetup( function( done ) {
        mkdirp( dbpath, function() {
            levelMaster = new Levelable({
                port: 3000,
                path: dbpath + 'test.db',
                sublevels: [
                    'conf'
                ]
            });
            levelMaster.listen()
                .then( ( s ) => {
                    server = s;
                    done();
                });

            levelRemotes.push( new Levelable({
                port: 3000
            }));
            levelRemotes.push( new Levelable({
                port: 3000
            }));
        });
    });

    suiteTeardown( function( done ) {
        setTimeout( function() {
            server.close( function() {
                levelMaster.rootDB.close( function() {
                    del([ dbpath ], done );
                });
            });
        }, 500 );
    });

    function put( con ) {
        return new Promise( ( resolve, reject ) => {
            con.client.put( 'test', 'foo', ( err ) => {
                if ( err ) {
                    reject( err );
                    return;
                }
                resolve( con );
            });
        });
    }

    function get( con ) {
        return new Promise( ( resolve, reject ) => {
            con.client.get( 'test', ( err, res ) => {
                if ( err ) {
                    reject( err );
                    return;
                }
                expect( res ).to.equal( 'foo' );
                resolve( con );
            });
        });
    }

    function tidy( con ) {
        return new Promise( ( resolve, reject ) => {
            con.socket.end();
            con.client.close( function( err ) {
                if ( err ) {
                    reject( err );
                    return;
                }
                resolve( con );
            });
        });
    }

    function startStagger( num ) {
        return new Promise( ( resolve, reject ) => {
            // Introduce some delay so the remotes dont fire at once
            setTimeout( () => {
                levelRemotes[ num ].connect( 'conf', {
                    manifest: manifest
                })
                    .then( put )
                    .then( get )
                    .then( tidy )
                    .then( resolve )
                    .catch( reject );
            }, num * 200 );
        });
    }

    function startConcurrent( num ) {
        return new Promise( ( resolve, reject ) => {
            levelRemotes[ num ].connect( 'conf', {
                manifest: manifest
            })
                .then( put )
                .then( get )
                .then( tidy )
                .then( resolve )
                .catch( reject );
        });
    }

    test( 'Expects that multiple remotes can connect and put and get data', function( done ) {
        var promises = levelRemotes.map( function( remote, index ) {
            return startStagger( index );
        });

        Promise.all( promises )
            .then( () => {
                done();
            })
            .catch( done );
    });

    test( 'Expects that multiple remotes can connect and put and get data concurrently', function( done ) {
        var promises = levelRemotes.map( function( remote, index ) {
            return startConcurrent( index );
        });

        Promise.all( promises )
            .then( () => {
                done();
            })
            .catch( done );
    });
});
