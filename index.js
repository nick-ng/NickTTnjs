// Requires
// People's requires
var express = require( 'express' ); var app = express();
var fs = require( 'fs' );
var http = require( 'http' ).Server( app );
var io = require( 'socket.io' )( http );
var $ = jQuery = require('jquery');
require('jquery-csv');
//var pg = require('pg'); // PostgreSQL handled by dbfun
// My requires
var bfun = require( __dirname + '/common/bfun' );
var dbfun = require( __dirname + '/common/dbfun' );

// "Global" variables
var PAGEDIR = __dirname + '/pages';
var DICTDIR = __dirname + '/dicts';
//var PG_DATABASE_URL = process.env.DATABASE_URL;
var SHORTENEDNAMES = [];
var NICKNAMES = [];
var NICKNAMES_TABLE_LOCKED = false;
var SHORTENEDNAMES_TABLE_LOCKED = false;
var TOURNAMENT_KEY_LENGTH = 8;

app.set( 'port', ( process.env.PORT || 3434 ) );
app.set( 'views', __dirname + '/public' );
//app.set('view engine', 'ejs');

app.use( express.static( __dirname + '/public' ) );
app.use( express.static( __dirname + '/js' ) );
//app.use( express.static( DICTDIR ) );

// PostgreSQL
initDatabase();

// The pages
app.get( '/', function( req, res ) {
  res.sendFile(PAGEDIR + '/home.html');
});
app.get( '/playerdetails', function(req, res) {
  res.sendFile(PAGEDIR + '/playerdetails.html');
});
app.get( '/finalstandings', function( req, res ) {
  res.sendFile(PAGEDIR + '/finalstandings.html');
});
app.get( '/rounddraws', function( req, res ) {
  res.sendFile(PAGEDIR + '/rounddraws.html');
});
app.get( '/roundscores', function( req, res ) {
  res.sendFile(PAGEDIR + '/roundscores.html');
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
  
  socket.on( 'playerDetailsChanged', function(updateObject, mode) {
    mode = mode || 'playerdetails';
    dbfun.updatePlayerDetails(updateObject, function(result) {
      //~ console.log('Player details updated');
      //~ console.log(result);
      // Update short names
      switch ( mode ) {
        case 'scores':
          // example
          break;
        case 'finalstandings':
          // example
          break;
        default: // playerdetails
          if (updateObject.field == 'full_name') {
            // If they changed the full name, push updated short names.
            dbfun.getAllPlayerDetails(updateObject.tKey, function(playerList) {
              playerList = chooseShortNames(playerList, true);
              io.to(socket.id).emit( 'pushAllPlayerDetails', playerList, 'shortNamesOnly');
            })
          };
      }
    });
  });
  
  socket.on( 'pullAllPlayerDetails',  function(tKey, mode) {
    mode = mode || 'playerdetails';
    dbfun.getAllPlayerDetails(tKey, function(playerList) {
      // sort out short names
      playerList = chooseShortNames(playerList);
      var extraInfo;
      // fix short names here.
      switch ( mode ) {
        case 'scores':
          //~ rounds = 1;
          extraInfo = 0; // rounds
          //~ for (var j = 0; j < playerList.length; j++) {
            //~ playerList[j].opponentnames = []; // Placeholder
            //~ for (var i = 0; i < rounds; i++) {
              //~ playerList[j].opponentnames[i] = '' + j + i;
            //~ }
          //~ }
          break;
        case 'rounddraw':
          extraInfo = 0; // example
          break;
        case 'finalstandings':
          extraInfo = 0; // example
          break;
        default: // playerdetails
          extraInfo = 'hello';
      }
      io.to(socket.id).emit( 'pushAllPlayerDetails', playerList, extraInfo);
    });
  });
  
  socket.on( 'pushRoundDraw', function(drawObject) {
    dbfun.roundDrawUpdate(drawObject, function(result) {
      //Put draw information on database
      io.to(socket.id).emit( 'drawAccepted', drawObject.round);
    });
  });
  
  /* ====================
   * = Name List events =
   * ==================== */
  socket.on( 'pullShortenedNames', function (parent) {
    getShortenedNamesFromDB( parent );
  });
  socket.on( 'pullNicknames', function ( parent ) {
    getNicknamesFromDB( parent )
  });
  
  // Comment these if people start messing with you?
  // Nicknames
  socket.on( 'addOneNickname', function (newNickname) {
    dbfun.upsertNickname( newNickname.real_name, newNickname.nickname, function() {
      getNicknamesFromDB( 'single' );
    });
  });
  
  socket.on( 'appendNicknames', function (tempText) {
    console.log('Trying to parse:\n' + tempText);
    var errorString = '';
    var nicknamesAdded = false;
    try {
      var tempNames = bfun.loadCSV( tempText );
      for ( var i = 0; i < tempNames.length; i++ ) {
        if (tempNames[i].length == 2) {
          tempNames[i][0] = bfun.trimAroundHyphen( tempNames[i][0] );
          tempNames[i][1] = bfun.removeWhiteSpace( tempNames[i][1] );
          dbfun.upsertNickname( tempNames[i][0], tempNames[i][1], function() {
            getNicknamesFromDB( 'append' );
          });
          nicknamesAdded = true;
        } else {
          errorString += 'Couldn\'t add ' + tempNames[i] + '<br/>';
        };
      };
    } catch(e) {
      errorString = 'Couldn\'t parse <br>' + tempText;
      console.error('Nick: Error when appending nicknames: ' + tempText, e);
    };
    if (!nicknamesAdded) {
      if (errorString.length == 0) {
        errorString = 'Couldn\'t add ' + tempText;
      };
      io.emit( 'nicknameOutstream', errorString );
      // Unlock buttons if dbfun never gets called.
      io.emit( 'nicknamesTableUnlocked' );
    };
  });
  
  socket.on( 'replaceNicknames', function (tempText) {
    var newNicknames = [];
    console.log('Trying to parse:\n' + tempText);
    var errorString = '';
    var nicknamesAdded = false;
    try {
      var tempNames = bfun.loadCSV( tempText );
      for ( var i = 0; i < tempNames.length; i++ ) {
        if (tempNames[i].length == 2) {
          var nicknameObj = {};
          // makeNicknamesOnDB already trims whitespace so no need here.
          nicknameObj.real_name = tempNames[i][0]
          nicknameObj.nickname = tempNames[i][1]
          newNicknames.push(nicknameObj);
          nicknamesAdded = true;
        } else {
          errorString += 'Couldn\'t add ' + tempNames[i] + '<br/>';
        };
      };
    } catch(e) {
      errorString = 'Couldn\'t parse <br>' + tempText;
      console.error('Nick: Error when replacing nicknames: ' + tempText, e);
    };
    if (!nicknamesAdded) {
      if (errorString.length == 0) {
        errorString = 'Couldn\'t add ' + tempText;
      };
      io.emit( 'nicknameOutstream', errorString );
      // Unlock buttons if dbfun never gets called.
      io.emit( 'nicknamesTableUnlocked' );
    } else {
      if (!NICKNAMES_TABLE_LOCKED) {
        NICKNAMES_TABLE_LOCKED = true;
        dbfun.ezQuery( 'DROP TABLE IF EXISTS nameschema.nicknames;', function(results) {
          makeNicknamesOnDB( newNicknames );
        });
      } else {
        io.emit( 'nicknamesTableLocked' );
      };
    };
  });
  
  socket.on( 'resetNicknames', function () {
    if (!NICKNAMES_TABLE_LOCKED) {
      NICKNAMES_TABLE_LOCKED = true;
      dbfun.ezQuery( 'DROP TABLE IF EXISTS nameschema.nicknames;', function(results) {
        makeNicknamesOnDB();
      });
    } else {
      io.emit( 'nicknamesTableLocked' );
    }
  });
  
  // Shortened names
  socket.on( 'resetShortenedNames', function () {
    if (!SHORTENEDNAMES_TABLE_LOCKED) {
      SHORTENEDNAMES_TABLE_LOCKED = true;
      dbfun.ezQuery( 'DROP TABLE IF EXISTS nameschema.shortened_names;', function(results) {
        makeShortenedNamesOnDB();
      });
    } else {
      io.emit( 'shortenedNamesTableLocked' );
    };
  });
  
  socket.on( 'addOneShortenedName', function (newShortenedName) {
    dbfun.upsertShortenedName( newShortenedName.long_name, newShortenedName.shortened_name, function() {
      getShortenedNamesFromDB( 'single' );
    });
  });
  
  socket.on( 'appendShortenedNames', function (tempText) {
    console.log('Trying to parse:\n' + tempText);
    var errorString = '';
    var shortenedNamesAdded = false;
    try {
      var tempNames = bfun.loadCSV( tempText );
      for ( var i = 0; i < tempNames.length; i++ ) {
        if (tempNames[i].length == 2) {
          tempNames[i][0] = bfun.trimAroundHyphen( tempNames[i][0] );
          tempNames[i][1] = bfun.removeWhiteSpace( tempNames[i][1] );
          dbfun.upsertShortenedName( tempNames[i][0], tempNames[i][1], function() {
            getShortenedNamesFromDB( 'append' );
          });
          shortenedNamesAdded = true;
        } else {
          errorString += 'Couldn\'t add ' + tempNames[i] + '<br/>';
        };
      };
    } catch(e) {
      errorString = 'Couldn\'t parse <br>' + tempText;
      console.error('Nick: Error when appending shortened names: ' + tempText, e);
    };
    if (!shortenedNamesAdded) {
      if (errorString.length == 0) {
        errorString = 'Couldn\'t parse ' + tempText;
      };
      io.emit( 'shortenedNameOutstream', errorString );
      // Unlock buttons if dbfun never gets called.
      io.emit( 'shortenedNamesTableUnlocked' );
    };
  });
  
  socket.on( 'replaceShortenedNames', function (tempText) {
    var newShortenedNames = [];
    console.log('Trying to parse:\n' + tempText);
    var errorString = '';
    var shortenedNamesAdded = false;
    try {
      var tempNames = bfun.loadCSV( tempText );
      for ( var i = 0; i < tempNames.length; i++ ) {
        if (tempNames[i].length == 2) {
          var shortenedNameObj = {};
          // makeNicknamesOnDB already trims whitespace so no need here.
          shortenedNameObj.long_name = tempNames[i][0]
          shortenedNameObj.shortened_name = tempNames[i][1]
          newShortenedNames.push(shortenedNameObj);
          shortenedNamesAdded = true;
        } else {
          errorString += 'Couldn\'t add ' + tempNames[i] + '<br/>';
        };
      };
    } catch(e) {
      errorString = 'Couldn\'t parse <br>' + tempText;
      console.error('Nick: Error when replacing shortened names: ' + tempText, e);
    };
    if (!shortenedNamesAdded) {
      if (errorString.length == 0) {
        errorString = 'Couldn\'t parse ' + tempText;
      };
      io.emit( 'shortenedNameOutstream', errorString );
      // Unlock buttons if dbfun never gets called.
      io.emit( 'shortenedNamesTableUnlocked' );
    } else {
      if (!SHORTENEDNAMES_TABLE_LOCKED) {
        SHORTENEDNAMES_TABLE_LOCKED = true;
        dbfun.ezQuery( 'DROP TABLE IF EXISTS nameschema.shortened_names;', function(results) {
          makeShortenedNamesOnDB( newNicknames );
        });
      } else {
        io.emit( 'shortenedNamesTableLocked' );
      };
    };
  });
  
  /* =========================
   * = Tournament-Key events =
   * ========================= */
  // Respond to the different buttons
  socket.on( 'pullTournamentKey', function (mode) {
    if (mode == 'new') {
      dbfun.getTournaments(function(tournamentList) {
        //~ console.log(tournamentList);
        var newSchema = bfun.generateNewSchema(TOURNAMENT_KEY_LENGTH, tournamentList);
        if (newSchema) {
          // We got a new unique key so make a tournament schema
          dbfun.ezQuery( 'CREATE SCHEMA ' + newSchema + ';', function(result) {
            var tournamentObj = {};
            tournamentObj.key = bfun.tSchema2tKey(newSchema);
            // Create tournament information and functions so a user can add player details while protecting us from SQLi
            dbfun.initialiseTournamentTables(tournamentObj, function(outObj) {
              // Let client know when we've created the tournament.
              io.to(socket.id).emit( 'pushTournamentKey', tournamentObj.key);
            });
          });
        } else {
          var errorMsg = 'Couldn\'t generate a new tournament-key in time. Something went wrong.';
          io.to(socket.id).emit( 'homeError', errorMsg);
        };
      });
    };
  });
  
  socket.on( 'checkTournamentKey', function (maybeKey) {
    dbfun.checkTournament(maybeKey, function(tournamentExists, actualKey) {
      if (tournamentExists) {
        //stuff
        io.to(socket.id).emit( 'pushTournamentKey', actualKey);
      } else {
        var errorMsg = maybeKey + ' is not a valid tournament-key.';
        io.to(socket.id).emit( 'homeError', errorMsg);
      };
    });
  });
  
  socket.on( 'demoTournamentReset', function (demoKey) {
    //reset the appropriate tournament
    // then push demo key via callback (place holder pushes directly)
    io.to(socket.id).emit( 'pushTournamentKey', demoKey);
  });
  
  // end of io.on( 'connection', callback() );
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
    if ( fullName1.toUpperCase() == shortenNames(NICKNAMES[i]['real_name']).toUpperCase() ) {
      // If they have a nickname, return an array with one element.
      //console.log([NICKNAMES[i]['nickname']]);
      return [NICKNAMES[i]['nickname']]; // returns a list with a single element.
    };
  };
  // Otherwise, shorten their name.
  return bfun.makeShortNameList(fullName1, playerID);
};

function chooseShortNames(playerList, shortNamesOnly) {
  playerList2 = [];
  for (var i = 0; i < playerList.length; i++) {
    var fullNameNoSpace = bfun.trimAroundHyphen(playerList[i].full_name);
    var shortNameNoSpace = bfun.trimAroundHyphen(playerList[i].short_name);
    if (fullNameNoSpace && !shortNameNoSpace) {
      //~ console.log(playerList[i].full_name);
      playerList[i].shortNameList = nickifyNames(playerList[i].full_name, playerList[i].id);
      if (playerList[i].shortNameList.length == 1) {
        // Is nickname so set that.
        playerList[i].short_name = playerList[i].shortNameList[0];
      } else {
        /* Place holder. I want to choose the name with the lowest index
         * that is also unique and if that index isn't 0, then all names
         * which are duplicates should also be removed. Probably use shift
         * in some manner.
         */
        playerList[i].short_name = playerList[i].shortNameList[1];
      }
      playerList2.push({id:playerList[i].id, short_name:playerList[i].short_name});
      //playerList2[i].id = playerList[i].id;
      //playerList2[i].short_name = playerList[i].short_name;
    } else {
      //~ console.log( 'Full name = "' + playerList[i].full_name + '"' );
      //~ console.log( 'Short name = "' + playerList[i].short_name + '"' );
    };
  };
  if (shortNamesOnly) { // Undefined is equivilant to false.
    return playerList2;
  };
  return playerList;
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
    io.emit( 'shortenedNamesTableUnlocked' );
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
