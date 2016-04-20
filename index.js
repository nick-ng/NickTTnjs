// Requires
// People's requires
var express = require( 'express' ); var app = express();
var fs = require( 'fs' );
var http = require( 'http' ).Server( app );
var io = require( 'socket.io' )( http );
var $ = jQuery = require('jquery');
require('jquery-csv');
// My requires
var bfun = require( __dirname + '/common/bfun' );

// "Global" variables
var PAGEDIR = __dirname + '/pages';
var DICTDIR = __dirname + '/dicts';

app.set( 'port', ( process.env.PORT || 3434 ));
app.set('views', __dirname + '/public');
//app.set('view engine', 'ejs');

app.use( express.static( __dirname + '/public' ) );
app.use( express.static( __dirname + '/js' ) );
//app.use( express.static( DICTDIR ) );

// Load some files
var SHORTENEDNAMES = bfun.loadCSVObjectsFile( DICTDIR + '/shortenednames.csv' );
var NICKNAMES = bfun.loadCSVObjectsFile( DICTDIR + '/nicknames.csv' );
// Remove excess white space from shortenednames
for ( var i = 0; i < SHORTENEDNAMES.length; i++ ) {
  SHORTENEDNAMES[i]['longName'] = bfun.removeWhiteSpace( SHORTENEDNAMES[i]['longName'] );
  SHORTENEDNAMES[i]['shortName'] = bfun.removeWhiteSpace( SHORTENEDNAMES[i]['shortName'] );
}
// Shorten realNames in NICKNAMES array
for ( var i = 0; i < NICKNAMES.length; i++ ) {
  NICKNAMES[i]['realName'] = shortenNames( NICKNAMES[i]['realName'] );
  // Remove excess white space
  //~ NICKNAMES[i]['realName'] = bfun.removeWhiteSpace( NICKNAMES[i]['realName'] );
  NICKNAMES[i]['realName'] = bfun.trimAroundHyphen( NICKNAMES[i]['realName'] );
  // Nicknames can have spaces around hyphens
  NICKNAMES[i]['nickName'] = bfun.removeWhiteSpace( NICKNAMES[i]['nickName'] );
}

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
  socket.on( 'fullName focusout', function(player) {
    // This is one of the places where you access the database.
    player.shortNames = nickifyNames( player.fullName, player.ID );
    player.shortName = player.shortNames[1]; // Check database if other players' shortNames need to be changed to avoid collisions.
    playerList = [player]
    io.emit( 'shortName change', playerList );
  });
});

http.listen( app.get( 'port' ), function(){
  console.log( 'listening on : ' + app.get('port') );
});

function shortenNames( namePart ) {
  var tempName = namePart;
  for ( var i = 0; i < SHORTENEDNAMES.length; i++ ) {
    var tempName2 = tempName.replace( SHORTENEDNAMES[i]['longName'], SHORTENEDNAMES[i]['shortName'] ); 
    //console.log( tempName + ' > ' + tempName2 );
    tempName = tempName2;
  };
  return tempName2;
};

/* Returns a player's nickname or a list of short names in increasing
 * length to avoid same-name collisions with other players */
function nickifyNames( fullName, playerID ) {
  var fullName1 = bfun.trimAroundHyphen( shortenNames( fullName ) );
  // Check if they have a nickname then return that.
  for ( var i = 0; i < NICKNAMES.length; i++ ) {
    if ( fullName1.toUpperCase() == NICKNAMES[i]['realName'].toUpperCase() ) {
      // If they have a nickname, return an array with one element.
      return [NICKNAMES[i]['nickName']];
    };
  };
  // Otherwise, shorten their name.
  var nameParts = fullName1.split( ' ' );
  if ( nameParts.length == 1 ) {
    var nameList = [
      bfun.shortenHyphenName( nameParts[0] ),
      nameParts[0]
    ];
    return nameList;
  };
  var firstName1 = nameParts.shift();
  var firstName = bfun.shortenHyphenName( firstName1 );
  var lastName = nameParts.pop();
  var lastInitials = bfun.initialHyphenName( lastName );
  var middleInitials = '';
  var middleNames = ' '; // middleNames has "surrounding" spaces.
  for (var i = 0; i < nameParts.length; i++) {
    middleInitials = middleInitials + nameParts[i].substring( 0,1 );
    middleNames = middleNames + nameParts[i] + ' ';
  }
  var nameList = [];
  nameList.push( firstName ); // First name (or initials of hyphenated name only)
  nameList.push( firstName + ' ' + lastInitials ); // First name + last initial(s)
  nameList.push( firstName + ' ' + lastName ); // First name + last name
  nameList.push( firstName1 ); // Full hyphenated first name.
  nameList.push( firstName1 + ' ' + lastName ); // Full hyphenated first name. Will be the same as firstName for most people?
  if ( middleInitials.length > 0 ) {
    nameList.push( firstName + ' ' + middleInitials + ' ' + lastName ); // First name + middle initial(s) + last name
  } else {
    nameList.push( firstName + ' ' + lastName); // This will cause another collision if all the players don't have middle names.
  }
  if ( middleInitials.length > 0 ) {
    nameList.push( firstName1 + ' ' + middleInitials + ' ' + lastName ); // First name + middle initial(s) + last name
  } else {
    nameList.push( firstName1 + ' ' + lastName); // This will cause another collision if all the players don't have middle names.
  }
  if ( middleInitials.length > 0 ) { // If they have middle names, they will have middle initials
    nameList.push( firstName + middleNames + lastName ); // First name + middle initial(s) + last name
  } else {
    nameList.push( firstName + ' ' + lastName); // This will cause another collision if all the players don't have middle names.
  }
  if ( middleInitials.length > 0 ) { // If they have middle names, they will have middle initials
    nameList.push( firstName1 + middleNames + lastName ); // First name + middle initial(s) + last name
  } else {
    nameList.push( firstName1 + ' ' + lastName); // This will cause another collision if all the players don't have middle names.
  }
  if ( middleInitials.length > 0 ) { // Including player IDs will prevent all collisions.
    nameList.push( firstName1 + middleNames + lastName + ' (' + playerID + ')' ); // First name + middle initial(s) + last name + ID
  } else {
    nameList.push( firstName1 + ' ' + lastName + ' (' + playerID + ')');
  }
  return nameList;
};
