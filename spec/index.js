require( 'babel/register' );

var fs = require( 'fs' );
var path = require( 'path' );

// Test every .js file (not this one) in this directory
var files = fs.readdirSync( __dirname );
files.forEach( function( filename ) {
    var filepath = path.resolve( __dirname, filename );
    if ( fs.statSync( filepath ).isFile() && /\.js/.test( filename ) && !/index/.test( filename ) ) {
        require( filepath );
    }
});
