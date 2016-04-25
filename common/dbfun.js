// Requires
var bfun = require( __dirname + '/bfun' );
var pg = require('pg');

// Global Variables
var dbfun = {};
var stringLikeTypes = ['char','text','date'];
var PG_DATABASE_URL = process.env.DATABASE_URL;

// PostgreSQL Client
pg.defaults.ssl = true;
pg.defaults.poolSize = 3;
//pg.defaults.database = process.env.DATABASE_URL;
/*
var pgClient1 = new pg.Client(PG_DATABASE_URL);
pgClient1.on('drain', function() {
  console.log('--pgClient1 drained');
  pgClient1.end.bind(pgClient1);
});
*/

console.log('Loaded dbfun');

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
      console.error('error fetching client from pool - nick', err);
    } else {
      if (params) {
        client.query(queryString, params, function(err, result) {
          done(); // call done() straight away so we don't "forget".
          if (err) {
            console.error('error when sending query - nick', err);
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
            console.error('error when sending query - nick', err);
          };
          if (result) {
            callback(result);
          };
        });
      };
    };
  });
}; //dbfun.ezQuery

dbfun.testParamFunction = function(number) {
  var pgClient1 = makeClient('Client ' + number);
  var funcQuery = 'CREATE OR REPLACE FUNCTION add(integer, integer, integer) RETURNS integer ' +
    'AS ' +
    '$$ ' +
    'SELECT $1 + $2 + $3;' + 
    '$$ ' +
    'LANGUAGE SQL ' +
    'IMMUTABLE ' +
    'RETURNS NULL ON NULL INPUT;';
  var query1 = pgClient1.query(funcQuery);
  query1.on( 'end', function(result) {
    console.log('--testParamFunction: query1 end');
    var query2 = pgClient1.query('SELECT add($1, $2, $3)',[1, -1, number]);
    query2.on( 'row', function(row) {
      console.log('--testParamFunction: query2 row');
      console.log(row);
    });
  });
  pgClient1.connect2();
  pgClient1.connect2();
};

dbfun.testTwo = function(number) {
  pg.connect( PG_DATABASE_URL, function(err, client, done) {
    if (err) {
      console.error('error fetching client from pool (' + number + ') - nick', err);
      //console.log('Reducing client pool size');
      //pg.defaults.poolSize--
      //if (pg.defaults.poolSize < 1) {
      //  pg.defaults.poolSize = 1;
      //};
      //console.log('Client pool size is ' + pg.defaults.poolSize);
    } else {
      client.query('SELECT add($1, $2)',[0, number], function(err, result) {
        done();
        if (err) {
          console.error('error when sending query ' + number + ' - nick', err);
        };
        if (result) {
          console.log('--testTwo ' + number + ': add query result.rows');
          console.log(result.rows);
          console.log(result.rows[0].add);
          //console.log('Executing nested query');
          client.query('SELECT add($1, $2)',[0, 1000 + number], function(err, result) {
            if (err) {
              console.error('error when sending query ' + (1000 + number) + ' - nick', err);
            };
            if (result) {
              console.log('--testTwo ' + (1000 + number) + ': add query result.rows');
              console.log(result.rows);
            };
          });
        };
      });
    };
  });
};

dbfun.testThree = function(number) {
  dbfun.ezQuery( 'SELECT add($1, $2)',[0, number], function(result) {
    console.log('---testThree ' + number + ': add query result.rows');
    console.log(result.rows);
    dbfun.ezQuery( 'SELECT add($1, $2)',[0, number+1000], function(result) {
      console.log('---testThree ' + (number+1000) + ': add query result.rows');
      console.log(result.rows);
    });
  });
};

dbfun.insertQueryMaker = function( targetTable, someInput, columnNames ) {
  if ( someInput.constructor !== Array ) {
    someInput = [someInput];
  };
  var insert1Str = 'INSERT INTO ' + targetTable + ' (';
  for (var i = 0; i < columnNames.length; i++) {
    var temp = columnNames[i].columnName + ' ' + columnNames[i].dataType + ', ';
    insert1Str = insert1Str + columnNames[i].columnName + ', ';
  }
  insert1Str = insert1Str.substring( 0, insert1Str.length-2 ) + ') VALUES ';
  for ( var i = 0; i < someInput.length; i++ ) {
    var temp = '(';
    for (var j = 0; j < columnNames.length; j++) {
      var dataType = columnNames[j].dataType;
      var isString = false;
      for ( var k = 0; k < stringLikeTypes.length; k++ ) {
        if (dataType.indexOf(stringLikeTypes[k]) > -1 ) {
          isString = true;
        }
      }
      if (isString) {
        temp = temp + '\'' + someInput[i][columnNames[j].columnName] + '\', ';
      } else {
        temp = temp + someInput[i][columnNames[j].columnName] + ', ';
      }
    }
    temp = temp.substring( 0, temp.length-2 ) + '), ';
    insert1Str = insert1Str + temp;
  }
  insert1Str = insert1Str.substring( 0, insert1Str.length-2 ) + ';';
  return insert1Str;
};

dbfun.upsertQueryMaker = function( targetTable, someInput, columnNames ) {
  /* targetTable: string with target table's name
   * someInput: array of objects with columnName: columnValue pairs.
   * columnNames: array of objects columnName: columnName, dataType: varchar(40)
   * with PRIMARY KEY first
   * E.G.
   * targetTable = "nameschema.nicknames";
   * someInput = [{real_name: "Nick Ng", nickname: "Lead Dev."},{real_name: "Phil Taylor", nickname: "Power, The"}];
   * columnNames = [{columnName: "real_name", dataType: "varchar(40)"},{columnName: "nickname", dataType: "varchar(20)"}];
   */
  // Make an "UPSERT" query for pre-9.5 PostgreSQL
  // If you get an object, convert to array with that object as the only element
  // Otherwise it's already an array of objects.
  if ( someInput.constructor !== Array ) {
    someInput = [someInput];
  };
  // start the query
  // Create temporary table called "newvals"
  var queryStr = 'BEGIN; ';
  var createStr = 'CREATE TEMPORARY TABLE newvals(';
  var insert1Str = 'INSERT INTO newvals(';
  for (var i = 0; i < columnNames.length; i++) {
    var temp = columnNames[i].columnName + ' ' + columnNames[i].dataType + ', ';
    createStr = createStr + temp;
    insert1Str = insert1Str + columnNames[i].columnName + ', ';
  }
  createStr = createStr.substring( 0, createStr.length-2 ) + ') ON COMMIT DROP; '; // cut to before the comma then add );
  queryStr = queryStr + createStr; // createStr is done so append to queryStr
  insert1Str = insert1Str.substring( 0, insert1Str.length-2 ) + ') VALUES ';
  for ( var i = 0; i < someInput.length; i++ ) {
    var temp = '(';
    for (var j = 0; j < columnNames.length; j++) {
      temp = temp + someInput[i][columnNames[j].columnName] + ', ';
    }
    temp = temp.substring( 0, temp.length-2 ) + '), ';
    insert1Str = insert1Str + temp;
  }
  insert1Str = insert1Str.substring( 0, insert1Str.length-2 ) + '; ';
  insert1Str = dbfun.insertQueryMaker( 'newvals', someInput, columnNames );
  insert1Str = insert1Str + ' ';
  queryStr = queryStr + insert1Str; // insert1Str is done.
  queryStr = queryStr + 'LOCK TABLE ' + targetTable + ' IN EXCLUSIVE MODE; ';
  queryStr = queryStr + 'UPDATE ' + targetTable + ' '; // Update is easy so no need to make a substring
  var setStr = 'SET ';
  for ( var i = 1; i < columnNames.length; i++ ) {
    var columnName = columnNames[i].columnName;
    var temp = columnName + ' = newvals.' + columnName + ', ';
    setStr = setStr + temp;
  }
  setStr = setStr.substring( 0, setStr.length-2 ) + ' ';
  queryStr = queryStr + setStr;
  var columnName0 = columnNames[0].columnName;
  queryStr = queryStr + 'FROM newvals WHERE newvals.' + columnName0 + ' = ' + targetTable + '.' + columnName0 + '; ';
  var insert2Str = 'INSERT INTO ' + targetTable + ' SELECT ';
  for ( var i = 0; i < columnNames.length; i++ ) {
    var columnName = columnNames[i].columnName;
    insert2Str = insert2Str + 'newvals.' + columnName + ', ';
  }
  insert2Str = insert2Str.substring( 0, insert2Str.length-2 ) + ' ';
  queryStr = queryStr + insert2Str;
  queryStr = queryStr + 'FROM newvals LEFT OUTER JOIN ' + targetTable + ' ON (';
  queryStr = queryStr + targetTable + '.' + columnName0 + ' = newvals.' + columnName0 + ') ';
  queryStr = queryStr + 'WHERE ' + targetTable + '.' + columnName0 + ' IS NULL; COMMIT;';
  return queryStr;
  /* start
  id integer, somedata text);

  INSERT INTO newvals(id, somedata) VALUES (2, 'Joe'), (3, 'Alan');

  LOCK TABLE testtable IN EXCLUSIVE MODE;

  UPDATE testtable
  SET somedata = newvals.somedata
  FROM newvals
  WHERE newvals.id = testtable.id;

  INSERT INTO testtable
  SELECT newvals.id, newvals.somedata
FROM newvals LEFT OUTER JOIN testtable ON (testtable.id = newvals.id)
WHERE testtable.id IS NULL;

COMMIT;
// End */
};

dbfun.upsertQueryMaker95 = function( targetTable, someInput, columnNames ) {
  var insert1Str = dbfun.insertQueryMaker( targetTable, someInput, columnNames );
  insert1Str = insert1Str.substring( 0, insert1Str.length-1 ) + ' ON CONFLICT DO UPDATE;';
  return insert1Str;
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
