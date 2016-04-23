// Requires
var fs = require( 'fs' );
// My requires
var $ = jQuery = require('jquery');
require('jquery-csv');

var csvOptions = {};
var stringLikeTypes = ['char','text'];

// This is an Object of functions which works because you can call
// object.keyName or object['keyName'] to access object elements.
// E.g. calling bfun.helloWorld() and bfun['helloWorld']() both work.
var bfun = {};

bfun.loadFile = function ( somePath ) {
  var fileOptions = 'utf8';
  var outString = fs.readFileSync( somePath, fileOptions );
  return outString;
};

bfun.loadCSV = function ( someString ) {
  var outArray = $.csv.toArrays( someString, csvOptions );
  return outArray;
};
  
bfun.loadCSVObjects = function ( someString ) {
  /* If you call toObjects with no callback and without the option
   * start: 1, it breaks on subsequent calls, missing the first, then
   * second, then third, etc. rows.
   * */
  var outArray = $.csv.toObjects( someString, {start: 1} );
  return outArray;
};
  
bfun.loadCSVFile = function ( somePath ) {
  var outArray = $.csv.toArrays( bfun.loadFile( somePath ), csvOptions );
  return outArray;
};
  
bfun.loadCSVObjectsFile = function ( somePath ) {
  //console.log(bfun.loadFile( somePath ));
  var outArray = bfun.loadCSVObjects( bfun.loadFile( somePath ) );
  //console.log(outArray);
  return outArray;
};
  
bfun.removeWhiteSpace = function ( someString ) {
  return someString.replace( /[\s\n\r]+/g, ' ' ).replace( /^\s|\s$/g, '' );
};
  
bfun.trimAroundHyphen = function ( someString ) {
  //var trimedOfSpaces = someString.replace( /[\s\n\r]+/g, ' ' ).replace( /^\s|\s$/g, '' );
  var trimedOfSpaces = bfun.removeWhiteSpace( someString );
  return trimedOfSpaces.replace( /(\s)*-(\s)*/g, '-' );
};
  
// Returns initials of a hyphenated name otherwise just returns the name.
// e.g. Jean-Sébastien > JS
bfun.shortenHyphenName = function ( someSubstring ) {
  //var firstPart = someSubstring.match( /^\w+-/ );
  //var otherParts = someSubstring.match( /-[^-\s]+/g );
  var nameParts = someSubstring.match( /[^-\s]+/g ); // Match all non-whitespace, non-hyphen strings of any length.
  if ( nameParts.length == 1 ) {
    return nameParts[0];
  } else {
    var nameInitials = '';
    for ( var i = 0; i < nameParts.length; i++ ) {
      nameInitials = nameInitials + nameParts[i].substring( 0,1 );
    }
    return nameInitials;
  }
};
  
bfun.initialHyphenName = function ( someSubstring ) {
  var nameParts = someSubstring.match( /[^-\s]+/g ); // Match all non-whitespace, non-hyphen strings of any length.
  var nameInitials = '';
  for ( var i = 0; i < nameParts.length; i++ ) {
    nameInitials = nameInitials + nameParts[i].substring( 0,1 );
  }
  return nameInitials;
};

bfun.helloWorld = function () {
  console.log('Hello World');
};

bfun.helloWorldN = function ( n ) {
  for ( var i = 0; i < n; i++ ) {
    bfun.helloWorld();
  }
};

bfun.upsertQueryMaker95 = function( targetTable, someInput, columnNames ) {
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
  insert1Str = insert1Str.substring( 0, insert1Str.length-2 ) + ' ON CONFLICT DO UPDATE;';
  return insert1Str;
};

bfun.insertQueryMaker = function( targetTable, someInput, columnNames ) {
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

bfun.upsertQueryMaker = function( targetTable, someInput, columnNames ) {
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
  insert1Str = bfun.insertQueryMaker( 'newvals', someInput, columnNames );
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

bfun.testCSV = function () {
  // It actually works properly though...
  console.log('Testing csvToObjects');
  var someString = 'longName,shortName\nChristopher,Chris\nDavid,Dave\nNicholas,Nick'
  var outArray1 = $.csv.toObjects( someString, {} );
  var outArray2 = $.csv.toObjects( someString, {} );
  console.log(outArray1);
  console.log(outArray2);
};

module.exports = bfun;
