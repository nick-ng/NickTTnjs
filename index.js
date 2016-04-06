// Requires
var express = require( 'express' );
var fs = require( 'fs' );
var csv = require( 'csv' );
var http = require( 'http' ).Server( app );
var io = require( 'socket.io' )( http );
// My requires
//var bfun = require( __dirname + '/common/bfun' );

// "Global" variables
var app = express();
var pagedir = __dirname + '/pages';
var dictdir = __dirname + '/dicts';

// Load some files
//var shortnames = bfun.loadCSV( dictdir + '/shortnames' );
//console.log( 'Short Names:' );
//console.log( shortnames );
//dictdir + '/shortnames'

app.set( 'port', ( process.env.PORT || 3434 ));

app.use( express.static( __dirname + '/public' ) );
app.use( express.static( __dirname + '/js' ) );
//app.use( express.static( dictdir ) );

app.get( '/', function( req, res ) {
  res.sendFile(pagedir + '/playerdetails.html');
  //res.send('<h1>Hello World</h1>');
});

io.on( 'connection', function( socket ){
  socket.on( 'name change', function(nameList) {
    //console.log( 'name change invoked' );
    //console.log( nameList );
    var shortName = nameList[1];
    // This is one of the places where you access the database.
    if ( nameList[2].length > 0 ) { // If they've entered a last name,
      shortName = shortName + ' ' + nameList[2].substring( 0,1 );
    }
    if ( ( nameList[3] == '' ) || ( nameList[3] == nameList[1] ) ) { // If they haven't changed the short name,
      io.emit( 'short change', [ nameList[0], shortName ] );
      console.log( shortnames );
    }
  });
});

http.listen( app.get( 'port' ), function(){
  console.log( 'listening on : ' + app.get('port') );
});

