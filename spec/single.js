/**
 * Tests running levelable in a single process
 */

require( 'babel/register' );
var Levelable = require( '../lib/index' );

var tape = require( 'tape' );


/**
 * Creating levelable should throw if no port or socket path is specified
 */
tape( 'Instantiating levelable', function( test ) {
    test.plan( 4 );

    var level = null;

    test.throws( function() {
        level = new Levelable();
    }, /TypeError/, 'new Levelable() throws with no parameters' );

    test.throws( function() {
        level = new Levelable({});
    }, {}, 'new Levelable() throws with no port or socket specified' );

    level = new Levelable({
        port: 3000
    });

    test.equals( level.listen, 3000, 'Levelable should register the port to listen at when created' );

    level = null;

    var socketPath = '/var/run/levelable.sock';
    level = new Levelable({
        socket: socketPath
    });

    test.equals( level.listen, socketPath, 'Levelable should register the socket to listen at when created'  );
});

/**
 * Test creating a db
 */
// tape( 'Server creation test', function( test ) {
//
//
//
// });
