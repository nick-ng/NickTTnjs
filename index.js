// Requires
// People's requires
var express = require( 'express' ); var app = express();
var fs = require( 'fs' );
var http = require( 'http' ).Server( app );
var io = require( 'socket.io' )( http );
var $ = jQuery = require('jquery');
require('jquery-csv');
var pg = require('pg');
// My requires
var bfun = require( __dirname + '/common/bfun' );
var dbfun = require( __dirname + '/common/dbfun' );

// "Global" variables
var PAGEDIR = __dirname + '/pages';
var DICTDIR = __dirname + '/dicts';
var PG_DATABASE_URL = process.env.DATABASE_URL;
var SHORTENEDNAMES = [];
var NICKNAMES = [];
var NICKNAMES_TABLE_LOCKED = false;

app.set( 'port', ( process.env.PORT || 3434 ) );
app.set( 'views', __dirname + '/public' );
//app.set('view engine', 'ejs');

app.use( express.static( __dirname + '/public' ) );
app.use( express.static( __dirname + '/js' ) );
//app.use( express.static( DICTDIR ) );

// PostgreSQL
pg.defaults.ssl = true;
var schemasAndTables = {};
schemasAndTables.schemas = ['names'];
var pgClient = new pg.Client(PG_DATABASE_URL);
pgClient.connect();
initDatabase( pgClient );
//var tempQuery = 'SELECT table_schema,table_name FROM information_schema.tables;'

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

// Socket.IO stuff
io.on( 'connection', function( socket ) {
  socket.on( 'fullName focusout', function(player) {
    // This is one of the places where you access the database.
    player.short_names = nickifyNames( player.fullName, player.ID );
    player.short_name = player.short_names[1]; // Check database if other players' short_names need to be changed to avoid collisions.
    playerList = [player]
    io.emit( 'short_name change', playerList );
  });
  
  // Name List events
  socket.on( 'pullShortenedNames', function ( parent ) {
    getShortenedNamesFromDB( parent );
  });
  socket.on( 'pullNicknames', function ( parent ) {
    getNicknamesFromDB( parent )
  });
  socket.on( 'resetNicknames', function () {
    if (!NICKNAMES_TABLE_LOCKED) {
      NICKNAMES_TABLE_LOCKED = true;
      var query = pgClient.query( 'DROP TABLE IF EXISTS nameschema.nicknames;' );
      query.on('end', function () { // No 'result' parameter but it still works?
        makeNicknamesOnDB();
      });
    } else {
      io.emit( 'nicknamesTableLocked' );
    }
  });
  socket.on( 'addOneNickname', function (newNickname) {
    dbfun.upsertNickname( newNickname.real_name, newNickname.nickname, function() {
      getNicknamesFromDB( 'single' );
    });
  });
});

http.listen( app.get( 'port' ), function(){
  console.log( 'listening on : ' + app.get('port') );
});

function shortenNames( namePart ) {
  var tempName = namePart;
  //console.log(SHORTENEDNAMES);
  for ( var i = 0; i < SHORTENEDNAMES.length; i++ ) {
    var tempName2 = tempName.replace( SHORTENEDNAMES[i]['long_name'], SHORTENEDNAMES[i]['shortened_name'] ); 
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
    if ( fullName1.toUpperCase() == NICKNAMES[i]['real_name'].toUpperCase() ) {
      // If they have a nickname, return an array with one element.
      //console.log([NICKNAMES[i]['nickname']]);
      return [NICKNAMES[i]['nickname'], NICKNAMES[i]['nickname']];
    };
  };
  // Otherwise, shorten their name.
  var nameParts = fullName1.split( ' ' );
  if ( nameParts.length == 1 ) { // If they only have one name, return [shortenedName
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

function initDatabase() {
  // Check if nameschema exists
  var queryString = 'SELECT exists(SELECT schema_name FROM information_schema.schemata WHERE schema_name = \'nameschema\');';
  dbfun.ezQuery( queryString, function(result) {
    console.log('Checking if nameschema exists:');
    console.log(result.rows[0].exists);
    if (!result.rows[0].exists) { // If it doesn't exist...
      // Create nameschema
      dbfun.ezQuery( 'CREATE SCHEMA nameschema;', function(result) {
        console.log('nameschema created');
        console.log(result);
        // Then create tables shortenednames and nicknames
        createNameTables();
      });
    } else { // It exists so...
      createNameTables(); // Which also checks if the tables exist
    };
  });
};

function createNameTables() {
  // Check if shortened_names table exists
  console.log('Checking if shortened_names exists');
  var sQueryString = 'SELECT exists(SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema=\'nameschema\' AND table_name=\'shortened_names\');';
  dbfun.ezQuery( sQueryString, function(result) {
    console.log('Does shortened_names exist? (rows[0])');
    console.log(result.rows[0]);
    if (!result.rows[0].exists) { // If it doesn't exist make table.
      makeShortenedNamesOnDB(); // No argument means load the default.
    } else { //else load names from table.
      getShortenedNamesFromDB( 'create' );
    }
  });
  // Check if nicknames table exists
  console.log('Checking if nicknames exists');
  var nQueryString = 'SELECT exists(SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema=\'nameschema\' AND table_name=\'nicknames\');';
  dbfun.ezQuery( nQueryString, function(result) {
    console.log('Does nicknames exist? (rows[0])');
    console.log(result.rows[0]);
    if (!result.rows[0].exists) { // If it doesn't exist...
      makeNicknamesOnDB(); // No argument means load the default.
    } else { // load names from table
      getNicknamesFromDB( 'create' );
    }
  });
};

// Create nametables on database
function makeShortenedNamesOnDB( newShortenedNames ) {
  if (typeof newShortenedNames === "undefined") {
    newShortenedNames = bfun.loadCSVObjectsFile( DICTDIR + '/shortenednames.csv' );
  } else if (newNicknames.constructor !== Array) {
    console.log('No shortened name list provided; loading default');
    newShortenedNames = bfun.loadCSVObjectsFile( DICTDIR + '/shortenednames.csv' );
  };
  // Load default table content from .csv file.
  // SHORTENEDNAMES = bfun.loadCSVObjectsFile( DICTDIR + '/shortenednames.csv' );
  // Remove excess white space from shortenednames
  // Create shortened_names table
  var sQueryString = 'CREATE TABLE nameschema.shortened_names (' +
  'long_name varchar(20) PRIMARY KEY,' +
  'shortened_name varchar(10) );';
  dbfun.ezQuery( sQueryString, function(result) {
    console.log('Created shortened_names');
    SHORTENEDNAMES_TABLE_LOCKED =  false;
    console.log(result);
    // Put shortened names into table.
    for (var i = 0; i < newShortenedNames.length; i++ ) {
      newShortenedNames[i]['long_name'] = bfun.removeWhiteSpace( newShortenedNames[i]['long_name'] );
      newShortenedNames[i]['shortened_name'] = bfun.removeWhiteSpace( newShortenedNames[i]['shortened_name'] );
      dbfun.upsertShortenedName( newShortenedNames[i]['long_name'], newShortenedNames[i]['shortened_name'], function(result) {
        getShortenedNamesFromDB( 'make' );
      });
    };
  });
};
function makeNicknamesOnDB( newNicknames ) {
  // Load default table content from .csv file.
  // .csv file may be unsorted so keep the array in this function
  // and pull a sorted array from the database after making the table.
  // If newNicknames isn't an array of nickNames, load default nicknames.
  if (typeof newNicknames === "undefined") {
    newNicknames = bfun.loadCSVObjectsFile( DICTDIR + '/nicknames.csv' );
  } else if (newNicknames.constructor !== Array) {
    newNicknames = bfun.loadCSVObjectsFile( DICTDIR + '/nicknames.csv' );
  };
  // Create nicknames table
  var nQueryString = 'CREATE TABLE nameschema.nicknames (' +
  'real_name varchar(40) PRIMARY KEY,' +
  'nickname varchar(20) );';
  dbfun.ezQuery( nQueryString, function(result) {
    console.log('Created nicknames table');
    NICKNAMES_TABLE_LOCKED = false;
    io.emit( 'nicknamesTableUnlocked' );
    console.log(result);
    // Put nicknames into table.
    //var queryString = 'INSERT INTO nameschema.nicknames (real_name,nickname) VALUES ';
    for (var i = 0; i < newNicknames.length; i++ ) {
      // Remove excess white space
      //~ console.log(NICKNAMES[i]['real_name']);
      newNicknames[i]['real_name'] = bfun.trimAroundHyphen( newNicknames[i]['real_name'] );
      // Nicknames can have spaces around hyphens
      newNicknames[i]['nickname'] = bfun.removeWhiteSpace( newNicknames[i]['nickname'] );
      dbfun.upsertNickname(newNicknames[i]['real_name'], newNicknames[i]['nickname'], function(result) {
        getNicknamesFromDB( 'make' ); // This may be sub_optimal.
      });
    };
  });
};

// Get namelists from database
function getShortenedNamesFromDB( parent ) {
  if (!SHORTENEDNAMES_TABLE_LOCKED) {
    SHORTENEDNAMES = [];
    var queryString = 'SELECT * FROM nameschema.shortened_names ORDER BY long_name;';
    console.log('Getting shortened_names from DB');
    dbfun.ezQuery( queryString, function(results) {
      console.log(results);
      SHORTENEDNAMES = results.rows.slice();
      console.log('Finished getting shortened_names');
      io.emit( 'pushShortenedNames', SHORTENEDNAMES, parent );
    });
  } else {
    io.emit( 'shortenedNamesTableLocked' );
  };
};
function getNicknamesFromDB( parent ) {
  // parent is where this function is and tells how the io.emit should be handled
  if (!NICKNAMES_TABLE_LOCKED) {
    NICKNAMES = [];
    var queryString = 'SELECT * FROM nameschema.nicknames ORDER BY real_name;';
    console.log('Getting nicknames from DB');
    dbfun.ezQuery( queryString, function(results) {
      NICKNAMES = results.rows.slice();
      console.log('Finished getting nicknames');
      io.emit( 'pushNicknames', NICKNAMES, parent );
    });
  } else {
    io.emit( 'nicknamesTableLocked' );
  };
};
