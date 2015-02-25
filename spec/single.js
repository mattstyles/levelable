/**
 * Tests running levelable in a single process
 */

require( 'babel/register' );
var Levelable = require( '../lib/index' );

var mkdirp = require( 'mkdirp' );
var del = require( 'del' );

var expect = require( 'chai' ).expect;

var dbPath = __dirname + '/.db/';
mkdirp.sync( dbPath );



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


        expect( level.listen ).to.equal( 3000 );
    });

    test( 'Levelable should register the socket to listen at when instantiated', function() {
        level = new Levelable({
            socket: socketPath
        });

        expect( level.listen ).to.equal( socketPath );
    });

});

/**
 * Test creating a db
 */
// test( 'Server creation test', function( t ) {
//     // t.plan( 1 );
//
//     var level = new Levelable({
//         port: 3000,
//         path: dbPath + 'test.db'
//     });
//
//     return level.create()
//         .then( function( server ) {
//             console.log( 'resolved' );
//         })
//         .catch( function( err ) {
//             console.log( 'hello error', err );
//         })
//     //     .then( function( server ) {
//     //         console.log( 'hello' );
//     //         // t.equals( server.address().port, 3000 );
//     //
//     //         // // Tidy up
//     //         // del([ dbPath ], function() {
//     //         //
//     //         // });
//     //     });
//
//
//     // setTimeout( function() {
//     //     t.equals( 1, 1 );
//     // }, 500 );
//
//
// });
