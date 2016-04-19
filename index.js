// Requires
var express = require( 'express' ); var app = express();
var fs = require( 'fs' );
var http = require( 'http' ).Server( app );
var io = require( 'socket.io' )( http );
// People's requires
var $ = jQuery = require('jquery');
require('jquery-csv');
// My requires
var bfun = require( __dirname + '/common/bfun' );

// "Global" variables
var PAGEDIR = __dirname + '/pages';
var DICTDIR = __dirname + '/dicts';

// Load some files
var SHORTNAMES = bfun.loadCSVObjectsFile( DICTDIR + '/shortnames.csv' );
// Remove excess white space from shortnames
for ( var i = 0; i < SHORTNAMES.length; i++ ) {
  SHORTNAMES[i]['longName'] = bfun.removeWhiteSpace( SHORTNAMES[i]['longName'] );
  SHORTNAMES[i]['shortName'] = bfun.removeWhiteSpace( SHORTNAMES[i]['shortName'] );
}
var NICKNAMES = bfun.loadCSVObjectsFile( DICTDIR + '/nicknames.csv' );
// Shorten realNames in NICKNAMES array
for ( var i = 0; i < NICKNAMES.length; i++ ) {
  NICKNAMES[i]['realName'] = shortenNames( NICKNAMES[i]['realName'] );
  // Remove excess white space
  NICKNAMES[i]['realName'] = bfun.removeWhiteSpace( NICKNAMES[i]['realName'] );
  NICKNAMES[i]['nickName'] = bfun.removeWhiteSpace( NICKNAMES[i]['nickName'] );
}

app.set( 'port', ( process.env.PORT || 3434 ));
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');

app.use( express.static( __dirname + '/public' ) );
app.use( express.static( __dirname + '/js' ) );
//app.use( express.static( DICTDIR ) );

// The pages
app.get( '/', function( req, res ) {
  res.sendFile(PAGEDIR + '/index.html');
});
app.get( '/playerdetails', function( req, res ) {
  res.sendFile(PAGEDIR + '/playerdetails.html');
});
app.get( '/finalstandings', function( req, res ) {
  res.sendFile(PAGEDIR + '/finalstandings.html');
});
app.get( '/rounddraws', function( req, res ) {
  res.sendFile(PAGEDIR + '/rounddraws.html');
});
app.get( '/scores', function( req, res ) {
  res.sendFile(PAGEDIR + '/scores.html');
});
app.get( '/options', function( req, res ) {
  res.sendFile(PAGEDIR + '/options.html');
});

io.on( 'connection', function( socket ) {
  socket.on( 'name change', function(nameList) {
    //console.log( 'name change invoked' );
    //console.log( nameList );
    var shortName = shortenNames( nameList[1] );
    var fullName = shortName + ' ' + nameList[2];
    // This is one of the places where you access the database.
    if ( nameList[2].length > 0 ) { // If they've entered a last name,
      var nickName = nickifyNames( fullName );
      if ( nickName ) { // nickName will be null if there isn't nickname for that player.
        shortName = nickName;
      } else {
        shortName = shortName + ' ' + nameList[2].substring( 0,1 );
      }
      if ( nameList[3] == '' ) { // If the short name field is still blank,
        io.emit( 'short change', [ nameList[0], shortName ] );
      }
    }
  });
});

http.listen( app.get( 'port' ), function(){
  console.log( 'listening on : ' + app.get('port') );
});

function shortenNames( namePart ) {
  var tempName = namePart;
  for ( var i = 0; i < SHORTNAMES.length; i++ ) {
    var tempName2 = tempName.replace( SHORTNAMES[i]['longName'], SHORTNAMES[i]['shortName'] ); 
    //console.log( tempName + ' > ' + tempName2 );
    tempName = tempName2;
  };
  return tempName2;
};

function nickifyNames( fullName ) {
  var fullName1 = bfun.removeWhiteSpace( shortenNames( fullName ) );
  for ( var i = 0; i < NICKNAMES.length; i++ ) {
    if ( fullName1.toUpperCase() == NICKNAMES[i]['realName'].toUpperCase() ) {
      return NICKNAMES[i]['nickName'];
    };
  };
  return null;
};
