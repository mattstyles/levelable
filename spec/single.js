/**
 * Tests running levelable in a single process
 */

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



        var tests = levels.map( function( level ) {
            return new Promise( ( resolve, reject ) => {
                level.listen()
                    .then( function( server ) {
                        expect( server ).to.exist;
                        server.close( resolve );
                    })
                    .catch( function( err ) {
                        reject( err );
                    });
            });
        });



        Promise.all( tests )
            .then( () => {
                done();
            })
            .catch( done );
    });

});
