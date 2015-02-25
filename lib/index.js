require( 'babel/polyfill' );

import modPath from 'path';
import EventEmitter from 'eventemitter3';
import multilevel from 'multilevel';
import level from 'level';
import Sublevel from 'level-sublevel';
import manifest from 'level-manifest';

class Levelable extends EventEmitter {
    constructor( {
        db=null,
        path='/.db/levelable.db',
        sublevels=[],
        port=null,
        socket=null
    } ) {
        if ( !port && !socket ) {
            throw new Error( 'server must be able to listen somewhere, specify port or socket' );
        }

        this.listen = port || socket;
        this.path = path;
        this.server = null;
        this.db = db;
        this.sublevels = sublevels;
        this.manifest = null;
        this.meta = null;
    }

    /**
     * Adds an additional sublevel
     */
    sublevel( sub ) {
        return new Promise( ( resolve, reject ) => {
            function onError( ...args ) {
                return reject( args.join( ' ' ) );
            }

            this.meta.get( 'sublevels', ( err, res ) => {
                if ( err ) {
                    onError( 'Error adding sublevel -', sub, '-', err );
                }
                if ( res.includes( sub ) ) {
                    return resolve( this.db.sublevel( sub ) );
                }
                res.push( sub );
                this.db.sublevel( sub );
                this.meta.put( 'sublevels', res, ( err ) => {
                    if ( err ) {
                        onError( 'Error adding sublevel -', sub, '-', err );
                    }

                    this.manifest = manifest( this.db );
                    multilevel.writeManifest( this.db, modPath.join( modPath.dirname( this.path ), 'manifest.json' ) );

                    resolve( this.db.sublevel( sub ) );
                });
            });
        });
    }

    /**
     * Creates the server
     */
    create() {
        try {
            this.db = this.db || new Sublevel( level( this.path, {
                valueEncoding: 'json'
            }));
        } catch( err ) {
            throw new Error( 'Error creating database -' + err );
        }

        try {
            this.meta = this.db.sublevel( 'meta' );
            this.meta.put( 'sublevels', this.sublevels );
        } catch ( err ) {
            throw new Error( 'Error putting sublevels into meta - ' + err );
        }

        this.sublevels.forEach( ( sub ) => {
            this.db.sublevel( sub );
        });

        this.db.methods = this.db.methods || {};
        this.manifest = manifest( this.db );
        multilevel.writeManifest( this.db, modPath.join( modPath.dirname( this.path ), 'manifest.json' ) );

        return new Promise( ( resolve, reject ) => {
            try {
                this.server = net.createServer( ( con ) => {
                    this.emit( 'connection', con );
                    con.pipe( multilevel.server( this.db ) ).pipe( con );
                }).listen( this.listen, () => {
                    this.emit( 'listen', this.server );
                    resolve( this.server );
                });
            } catch ( err ) {
                reject( err );
            }
        })
    }

    connect( sub ) {
        return new Promise( ( resolve, reject ) => {
            var client = null;
            try {
                // connect to the manifest file
                client = multilevel.client( this.manifest || require( modPath.join( modPath.basename(), 'manifest.json' ) ) );
                var con = net.connect( this.listen, () => {
                    // Resolve either the sublevel or the whole db and the connection
                    resolve({
                        client: sub ? client.sublevel( sub ) : client,
                        socket: con
                    });
                });
                con.pipe( client.createRpcStream() ).pipe( con );
            } catch ( err ) {
                reject( err );
            }
        });
    }
}

export default Levelable;
