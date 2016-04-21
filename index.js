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

// "Global" variables
var PAGEDIR = __dirname + '/pages';
var DICTDIR = __dirname + '/dicts';
var PG_DATABASE_URL = process.env.DATABASE_URL;

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

// PostgreSQL
pg.defaults.ssl = true;
var schemasAndTables = {};
schemasAndTables.schemas = ['names'];
var pgClient = new pg.Client(PG_DATABASE_URL);
pgClient.connect();
initDatabase( pgClient, schemasAndTables );
var tempQuery = 'SELECT table_schema,table_name FROM information_schema.tables;'
pgClient.query(tempQuery).on('row', function(row) {
  //~ console.log(JSON.stringify(row));
});

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

function initDatabase( someClient, schemasAndTables ) {
  // Check if nameschema exists
  var queryString = 'SELECT exists(SELECT schema_name FROM information_schema.schemata WHERE schema_name = \'nameschema\');';
  test = someClient.query(queryString);
  test.on('row', function(row) {
    console.log('Exists query:');
    console.log(row.exists);
    if (!row.exists) { // If it doesn't exist...
      // Create nameschema
      var test = someClient.query('CREATE SCHEMA nameschema;');
      test.on('end', function(result) {
        console.log('nameschema created');
        console.log(result);
        // Then create tables shortenednames and nicknames
        createNameTables( someClient );
      });
    } else { // It exists so...
      createNameTables( someClient ); // Which also checks if the tables exist
    };
  });
};

function createNameTables( someClient ) {
  // Check if shortenednames exists
  console.log('Checking if shortened_names exists');
  //var sQueryString = 'SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema=\'nameschema\' AND table_name=\'shortened_names\';';
  var sQueryString = 'SELECT exists(SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema=\'nameschema\' AND table_name=\'shortened_names\');';
  //var sQueryString = 'SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema=\'nameschema\' AND table_name=\'test_table\';';
  //var sQueryString = 'SELECT exists(SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema=\'nameschema\' AND table_name=\'test_table\');';
  var sQuery = someClient.query( sQueryString );
  var sRows = [];
  sQuery.on('row', function(row) {
    console.log('Does shortened_names exist? (row)');
    console.log(row);
    sRows.push(row);
    if (!row.exists) { // If it doesn't exist...
      // Create shortened_names table
      sQueryString = 'CREATE TABLE nameschema.shortened_names (' +
      'long_name varchar(20),' +
      'shortened_name varchar(10) );';
      var sQuery = someClient.query( sQueryString );
      sQuery.on('end', function(result) {
        console.log('Created shortened_names');
        console.log(result);
        // Put shortened names into table.
        console.log('Making query string');
        var queryString = 'INSERT INTO nameschema.shortened_names (long_name,shortened_name) VALUES ';
        for (var i = 0; i < SHORTENEDNAMES.length; i++ ) {
          queryString = queryString + '(\'' + SHORTENEDNAMES[i]['longName'] + '\',\'' + SHORTENEDNAMES[i]['shortName'] + '\'),';
        };
        //queryString[queryString.length-1] = ';';
        // str.substring( 0, str.length ) returns the whole string!?
        queryString = queryString.substring( 0, queryString.length-1 ) + ';';
        console.log(queryString.substring( queryString.length-7,queryString.length ) );
        var sQuery = someClient.query( queryString );
        sQuery.on('end', function(result) {
          console.log('Populated shortened_names');
          console.log(result);
        });
      });
    } else { //else load names from table.
      SHORTENEDNAMES = [];
      var queryString = 'SELECT * FROM nameschema.shortened_names;';
      console.log('Getting shortened_names from db');
      var sQuery = someClient.query( queryString );
      sQuery.on('row', function(row) {
        console.log(row);
        var shortenedPair = {};
        shortenedPair['longName'] = row.long_name;
        shortenedPair['shortName'] = row.shortened_name;
        SHORTENEDNAMES.push(shortenedPair);
      });
      sQuery.on('end', function(result) {
        console.log('Finished getting shortened_names');
        console.log(SHORTENEDNAMES);
      });
    }
  });
  /*sQuery.on('end', function(result) {
    console.log('Does shortenednames exist? (end)');
    console.log(result);
    console.log('sRows');
    console.log(sRows);
  }); */
};
