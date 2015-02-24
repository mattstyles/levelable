import path from 'path';
import EventEmitter from 'eventemitter3';
import multilevel from 'multilevel';
import level from 'level';
import Sublevel from 'level-sublevel';
import manifest from 'level-manifest';

function noop() {};

class Levelable extends EventEmitter {
    constructor({
        db=null,
        dbpath='/.db/levelable.db',
        sublevels=[],
        port=null,
        socket=null
    }) {
        if ( !port && !socket ) {
            throw new Error( 'server must be able to listen somewhere, specify port or socket' );
        }

        this.listen = port || socket;
        this.server = null;

        try {
            this.db = db || new Sublevel( level( dbpath ) );
        } catch( err ) {
            throw new Error( 'Error creating database', err );
        }

        sublevels.forEach( sub => {
            this.db.sublevel( sub );
        });

        this.db.methods = this.db.methods || {};
        this.manifest = manifest( this.db );
    }

    /**
     * Creates the server
     */
    create() {
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
}

export default Levelable;
