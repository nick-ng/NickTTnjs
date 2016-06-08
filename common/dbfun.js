// Requires
var bfun = require( __dirname + '/bfun' );
var pg = require('pg');

// Global Variables
var dbfun = {};
var stringLikeTypes = ['char','text','date'];
var PG_DATABASE_URL = process.env.DATABASE_URL;

// PostgreSQL Client
pg.defaults.ssl = true;
pg.defaults.poolSize = 3; // Increase based on your database privileges
//pg.defaults.database = process.env.DATABASE_URL;
/*
var pgClient1 = new pg.Client(PG_DATABASE_URL);
pgClient1.on('drain', function() {
  console.log('--pgClient1 drained');
  pgClient1.end.bind(pgClient1);
});
*/

/* upsert function from PostgreSQL manual
CREATE FUNCTION merge_db(key INT, data TEXT) RETURNS VOID AS
$$
BEGIN
    LOOP
        -- first try to update the key
        UPDATE db SET b = data WHERE a = key;
        IF found THEN
            RETURN;
        END IF;
        -- not there, so try to insert the key
        -- if someone else inserts the same key concurrently,
        -- we could get a unique-key failure
        BEGIN
            INSERT INTO db(a,b) VALUES (key, data);
            RETURN;
        EXCEPTION WHEN unique_violation THEN
            -- Do nothing, and loop to try the UPDATE again.
        END;
    END LOOP;
END;
$$
LANGUAGE plpgsql;
* 
* SELECT merge_db(1, 'david');
* 
* var query = client.query("SELECT name FROM users WHERE email = $1", ['brianc@example.com']);

    again.on('row', function(row) {
      //do something else
      assert.equal('brianc', row.name);
    });
* */

var funcList = [];
// Function Start
var funcObj = {};
funcObj.funcName = 'add()';
funcObj.funcQuery = 'CREATE OR REPLACE FUNCTION ' +
  'add(integer, integer) RETURNS integer AS ' +
  '$$ ' +
  'SELECT $1 + $2;' + 
  '$$ ' +
  'LANGUAGE SQL ' +
  'IMMUTABLE ' + // VOLATILE, STABLE, IMMUTABLE
  'RETURNS NULL ON NULL INPUT;';
funcList.push(funcObj);
// Function End
// upsert_nickname Start
var funcObj = {};
funcObj.funcName = 'upsert_nickname()';
funcObj.funcQuery = 'CREATE OR REPLACE FUNCTION ' +
  'upsert_nickname(new_real varchar(40), new_nick varchar(20)) RETURNS VOID AS '+
  '$$ ' +
  'BEGIN ' +
    'LOOP ' +
        'UPDATE nameschema.nicknames SET nickname = new_nick WHERE real_name = new_real; ' +
        'IF found THEN ' +
            'RETURN; ' +
        'END IF; ' +
        'BEGIN ' +
            'INSERT INTO nameschema.nicknames(real_name,nickname) VALUES (new_real, new_nick); ' +
            'RETURN; ' +
        'EXCEPTION WHEN unique_violation THEN ' +
        'END; ' +
    'END LOOP; ' +
  'END; ' +
  '$$ ' +
  'LANGUAGE plpgsql;';
funcList.push(funcObj);
// upsert_nickname End
// upsert_shortened_name Start
var funcObj = {};
funcObj.funcName = 'upsert_shortened_name()';
funcObj.funcQuery = 'CREATE OR REPLACE FUNCTION ' +
  'upsert_shortened_name(new_long varchar(20), new_shortened varchar(10)) RETURNS VOID AS '+
  '$$ ' +
  'BEGIN ' +
    'LOOP ' +
        'UPDATE nameschema.shortened_names SET shortened_name = new_shortened WHERE long_name = new_long; ' +
        'IF found THEN ' +
            'RETURN; ' +
        'END IF; ' +
        'BEGIN ' +
            'INSERT INTO nameschema.shortened_names(long_name,shortened_name) VALUES (new_long, new_shortened); ' +
            'RETURN; ' +
        'EXCEPTION WHEN unique_violation THEN ' +
        'END; ' +
    'END LOOP; ' +
  'END; ' +
  '$$ ' +
  'LANGUAGE plpgsql;';
funcList.push(funcObj);
// upsert_shortened_name End
// insert_id_to_playertable Start
var funcObj = {};
funcObj.funcName = 'insert_id_to_playertable()';
funcObj.funcQuery = 'CREATE OR REPLACE FUNCTION ' +
  'insert_id_to_playertable(_tbl regclass, _id integer) RETURNS VOID AS '+
  '$$ ' +
  'BEGIN ' +
    'BEGIN ' +
      'EXECUTE format(\'INSERT INTO %s(id) VALUES (%s)\', _tbl, _id); ' +
    'EXCEPTION WHEN unique_violation THEN ' +
    'END; ' +
  'END; ' +
  '$$ ' +
  'LANGUAGE plpgsql;';
funcList.push(funcObj);
// insert_id_to_playertable End
//console.log(funcList.length);

makeClient = function(name) {
  name = '' + name || 'Unnamed';
  var pgClient1 = new pg.Client(PG_DATABASE_URL);
  pgClient1.name = name;
  pgClient1.connected = false;
  pgClient1.connect2 = function() {
    if ( !this.connected ) {
      console.log('--Connecting ' + this.name);
      this.connect();
      this.connected = true;
    } else {
      console.log('--' + this.name + ' is already connected');
    };
  };
  pgClient1.on('drain', function() {
    console.log('--' + this.name + ' drained');
    pgClient1.end.bind(pgClient1);
    this.connected = false;
  });
  return pgClient1;
};

dbfun.ezQuery = function( queryString, input1, input2 ) {
  // input 1 and input 2 can be any combination of undefined, array and function
  // ezQuery( queryString, parameters, callback )
  // ezQuery( queryString, callback )
  // If input 
  var params = undefined;
  var callback = function(){}; // Initialise callback with an empty function.
  if (typeof input1 !== "undefined") {
    if (input1.constructor === Function) {
      callback = input1;
    } else if (input1.constructor === Array) {
      params = input1;
    } else {
      console.log('input1 is not a recognised type');
    };
  };
  if (typeof input2 !== "undefined") {
    if (input2.constructor === Function) {
      callback = input2;
    } else if (input2.constructor === Array) {
      params = input2;
    } else {
      console.log('input2 is not a recognised type');
    };
  };
  pg.connect( PG_DATABASE_URL, function(err, client, done) {
    if (err) {
      console.error('Nick: Error fetching client from pool', err);
    } else {
      if (params) {
        client.query(queryString, params, function(err, result) {
          done(); // call done() straight away so we don't "forget".
          if (err) {
            console.error('Nick: Error when sending query: ' + queryString, err);
          };
          if (result) {
            // Doesn't call back if results isn't returned.
            callback(result);
          };
        });
      } else {
        client.query(queryString, function(err, result) {
          done();
          if (err) {
            console.error('Nick: Error when sending query: ' + queryString, err);
          };
          if (result) {
            callback(result);
          };
        });
      };
    };
  });
}; //dbfun.ezQuery

dbfun.upsertNickname = function(realName, nickname, callback) {
  dbfun.ezQuery( 'SELECT upsert_nickname($1, $2)',[realName, nickname], function(result) {
    //console.log('upsert_nickname query result');
    //console.log(result);
    callback();
  });
};

dbfun.upsertShortenedName = function(longName, shortenedName, callback) {
  dbfun.ezQuery( 'SELECT upsert_shortened_name($1, $2)',[longName, shortenedName], function(result) {
    //console.log('upsert_nickname query result');
    //console.log(result);
    callback();
  });
};

dbfun.getTournaments = function(callback) {
  var queryString = 'SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE \'tournament_\%\';';
  //console.log(queryString);
  dbfun.ezQuery( queryString, function(result) {
    var tournamentList = [];
    for (var i = 0; i < result.rows.length; i++) {
      tournamentList.push(result.rows[i].schema_name);
    };
    callback(tournamentList);
  });
};

dbfun.checkTournament = function(tKey, callback) {
  var tSchema = bfun.tKey2tSchema(tKey);
  var queryString = 'SELECT schema_name FROM information_schema.schemata WHERE schema_name = \'' + tSchema + '\';';
  dbfun.ezQuery( queryString, function(result) {
    //~ console.log(result.rows);
    callback(result.rows.length != 0, bfun.tSchema2tKey(tSchema)); // passes false if tSchema isn't found.
  });
};

dbfun.initialiseTournamentTables = function initialiseTournamentTables(tObject, callback) {
  var tSchema = bfun.tKey2tSchema(tObject.key);
  // Create infotable
  var infoQuery = 'CREATE TABLE ' + tSchema + '.infotable (' +
    'id smallint PRIMARY KEY,' + // This table only has 1 row so this is to allow updating one value at a time.
    'players_key text,' +
    'name text,' +
    'date date DEFAULT CURRENT_DATE,' +
    'completed boolean DEFAULT FALSE,' +
    'left_image_url text,' +
    'right_image_url text);';
  // Create playertable
  var playerQuery = 'CREATE TABLE ' + tSchema + '.playertable (' +
    'id smallint PRIMARY KEY,' +
    'full_name text,' +
    'email text,' +
    'short_name text,' +
    'stillplaying boolean DEFAULT FALSE,' +
    'paid boolean DEFAULT FALSE,' +
    'club text,' +
    'faction text,' +
    'opponentids smallint[] DEFAULT \'{}\',' +
    'score int[] DEFAULT \'{}\',';
  for (var i = 0; i <= 5; i++) {
    // A 2D array would be better but I can't figure out an easy way to change its size.
    playerQuery += 'tiebreak' + i + ' int[] DEFAULT \'{}\',';
  };
  for (var i = 0; i <= 5; i++) {
    // A 2D array would be better but I can't figure out an easy way to change its size.
    playerQuery += 'softscore' + i + ' int[] DEFAULT \'{}\',';
  };
  playerQuery += 'tablenumbers smallint[] DEFAULT \'{}\');';
  
  dbfun.ezQuery(infoQuery, function(result) {
    dbfun.ezQuery( 'INSERT INTO ' + tSchema + '.infotable (id) VALUES (1);', function(result) {
      dbfun.updateTournamentInfo( 'name', tSchema, tObject.tournamentName);
      dbfun.updateTournamentInfo( 'date', tSchema, tObject.tournamentDate);
      dbfun.updateTournamentInfo( 'players_key', tSchema, tObject.playersKey);
    });
    dbfun.ezQuery(playerQuery, callback);
  });
  return;
};

dbfun.updateTournamentInfo = function updateTournamentName( property, tSchema, propVal ) {
  if (tSchema) {
    tSchema = bfun.sanitize(tSchema);
    qProp = false;
    if (property == 'name') {qProp = 'name';}
    else if (property == 'players_key') {qProp = 'players_key';}
    else if (property == 'date') {qProp = 'date';}
    else if (property == 'left_image') {qProp = 'left_image_url';}
    else if (property == 'right_image') {qProp = 'right_image_url';}
    else if (property == 'completed') {
      if (propVal) {
        dbfun.ezQuery( 'UPDATE ' + tSchema + '.infotable SET completed = TRUE WHERE id = 1;' );
      } else {
        dbfun.ezQuery( 'UPDATE ' + tSchema + '.infotable SET completed = FALSE WHERE id = 1;' );
      }
      return;
    }
    if (qProp && propVal) {
      var nameQuery = 'UPDATE ' + tSchema + '.infotable SET ' + qProp + ' = $1 WHERE id = 1;';
      dbfun.ezQuery( nameQuery, [propVal]);
    }
  }
  return;
};

dbfun.updateTournamentDate = function updateTournamentDate( tSchema, tournamentDate ) {
  if (tournamentDate && tSchema) {
    tSchema = bfun.sanitize(tSchema);
    var dateQuery = 'UPDATE ' + tSchema + '.infotable SET tournament_date = $1 WHERE id = 1;';
    dbfun.ezQuery(dateQuery, [tournamentDate]);
  }
};

dbfun.updatePlayerDetails = function(updateObject, callback) {
  // updateObject.tKey - Tournament Key
  // updateObject.id - Player ID to update - generated by us so can't be attacked?
  // updateObject.field - Player field to object (full_name, email, etc.);
  // updateObject.value - New value of field
  dbfun.checkTournament(updateObject.tKey, function(exists, actualKey) {
    if (exists) {
      var tSchema = bfun.tKey2tSchema(actualKey);
      var id = parseInt(updateObject.id);
      var field = bfun.sanitize(updateObject.field);
      if (typeof updateObject.round === 'number') {
        field += '[' + updateObject.round + ']';
      };
      var params = [id, updateObject.value]
      if (updateObject.value.constructor === Array) { // handle arrays. Only update one value in an array at a time with this function.
        for (var i = 0; i < updateObject.value.length; i++) {
          if (updateObject.value[i] != null) {
            pi = i + 1;
            field += '[' + pi + ']';
            params[1] = updateObject.value[i];
            break;
          }
        }
      }
      var queryString = 'UPDATE ' + tSchema + '.playertable SET ' + field + ' = $2 WHERE id = $1;';
      //~ console.log('updateObject.value =');
      //~ console.log(updateObject.value);
      //~ console.log('Sending ' + queryString + ' with:');
      //~ console.log(params);
      if (!isNaN(id)) {
        dbfun.ezQuery( 'SELECT insert_id_to_playertable($1, $2)', [tSchema + '.playertable', updateObject.id], function(result) {
          if (callback) {
            dbfun.ezQuery(queryString, params, callback); // callback is returned "result" from query
          } else {
            dbfun.ezQuery(queryString, params);
          };
        });
      } else {
        console.log(updateObject.id + ' is not a valid player id. Someone is messing with your web app.');
      };
    } else {
      console.log(updateObject.tKey + ' is not a valid tournament-key. Someone is messing with your web app.');
    };
  });
};

dbfun.getAllPlayerDetails = function(tournamentKey, callback) {
  dbfun.checkTournament(tournamentKey, function(exists, actualKey) {
    if (exists) {
      var tSchema = bfun.tKey2tSchema(actualKey);
      var queryString = 'SELECT * FROM ' + tSchema + '.playertable ORDER BY id;';
      dbfun.ezQuery(queryString, function(result) {
        callback(result.rows);
      });
    } else {
      console.log(tournamentKey + ' is not a valid tournament-key. Someone is messing with your web app.');
    }
  });
};

dbfun.roundDrawUpdate = function roundDrawUpdate(drawObject, callback) {
  /* drawObject.drawList = drawList;
   * drawObject.round = tabID;
   * drawObject.tKey = common.tournamentKey;
   */
  var abort = false;
  var tSchema = bfun.tKey2tSchema(drawObject.tKey);
  var round = bfun.sanitize(drawObject.round);
  var queryString = '';
  if (drawObject.drawList && (drawObject.drawList.constructor === Array)) {
    for (var i = 0; i < drawObject.drawList.length; i++) {
      //{map:assignedMap, players:pairList[i]}
      var map = parseInt(drawObject.drawList[i].map);
      var players = drawObject.drawList[i].players;
      var p1 = parseInt(players[0]);
      var p2 = parseInt(players[1]);
      if (round * map * p1 * p2) { // round, map, p1 and p2 must all be numbers greater than 0;
      // player1
        queryString += 'UPDATE ' + tSchema + '.playertable SET opponentids[' + round + '] = ' + p1 + ' WHERE id = ' + p2 + ';';
        queryString += 'UPDATE ' + tSchema + '.playertable SET opponentids[' + round + '] = ' + p2 + ' WHERE id = ' + p1 + ';';
        queryString += 'UPDATE ' + tSchema + '.playertable SET tablenumbers[' + round + '] = ' + map + ' WHERE id = ' + p2 + ';';
        queryString += 'UPDATE ' + tSchema + '.playertable SET tablenumbers[' + round + '] = ' + map + ' WHERE id = ' + p1 + ';';
      } else {
        abort = true;
      };
    };
  } else {
    abort = true;
  };
  if (!abort) {
    dbfun.ezQuery(queryString, callback);
  };
};

module.exports = dbfun;

// Initialise database functions:
for (var i = 0; i < funcList.length; i++) {
  var funcName = funcList[i].funcName;
  dbfun.ezQuery( funcList[i].funcQuery, function(result) {
    // This callback function isn't called untill later so if you use
    // the loop index "i" in it, the loop index will be whatever the
    // loop gets to when the callback gets executed. Probably the last
    // value since the loop will likely finish before the callback is
    // called. So i = funcList.length as it gets incremented, then the
    // loop condition gets checked, then the loop exits.
    console.log('funcQuery (' + funcName + ') result');
    console.log(result);
  });
};

console.log('Loaded dbfun');
