// Requires
var fs = require( 'fs' );
// My requires
var $ = jQuery = require( 'jquery' );
require( 'jquery-csv' );

var csvOptions = {};

// This is an Object of functions which works because you can call
// object.keyName or object['keyName'] to access object elements.
// E.g. calling bfun.helloWorld() and bfun['helloWorld']() both work.
var bfun = {};

bfun.loadFile = function loadFile(somePath) {
  var fileOptions = 'utf8';
  var outString = fs.readFileSync(somePath, fileOptions);
  return outString;
};

bfun.loadCSV = function loadCSV(someString) {
  // Remove spaces between " and ,
  someString = someString.replace(/"\s+,/g, '",' );
  // Remove spaces between , and "
  someString = someString.replace(/,\s+"/g, ',"' );
  // Remove spaces before 
  var outArray = $.csv.toArrays(someString, csvOptions);
  return outArray;
};
  
bfun.loadCSVObjects = function loadCSVObjects(someString) {
  /* If you call toObjects with no callback and without the option
   * start: 1, it breaks on subsequent calls, missing the first, then
   * second, then third, etc. rows.
   * */
  var outArray = $.csv.toObjects(someString, {start: 1});
  return outArray;
};
  
bfun.loadCSVFile = function loadCSVFile(somePath) {
  var outArray = $.csv.toArrays(bfun.loadFile(somePath), csvOptions);
  return outArray;
};
  
bfun.loadCSVObjectsFile = function loadCSVObjectsFile(somePath) {
  //console.log(bfun.loadFile(somePath));
  var outArray = bfun.loadCSVObjects(bfun.loadFile(somePath));
  //console.log(outArray);
  return outArray;
};
  
bfun.removeWhiteSpace = function removeWhiteSpace(someString) {
  if (someString == null) {
    return null
  };
  // Replace multiple spaces with one, REMOVE leading and trailing spaces.
  return someString.replace(/[\s\n\r]+/g, ' ' ).replace(/^\s|\s$/g, '' );
  // This matches leading and trailing spaces of any number /^\s+|\s+$/g
};
  
bfun.trimAroundHyphen = function trimAroundHyphen(someString) {
  if (someString == null) {
    return null
  };
  //var trimedOfSpaces = someString.replace(/[\s\n\r]+/g, ' ' ).replace(/^\s|\s$/g, '' );
  var trimedOfSpaces = bfun.removeWhiteSpace(someString);
  return trimedOfSpaces.replace(/(\s)*-(\s)*/g, '-' );
};
  
// Returns initials of a hyphenated name otherwise just returns the name.
// e.g. Jean-Sébastien > JS
bfun.shortenHyphenName = function shortenHyphenName(someSubstring) {
  //var firstPart = someSubstring.match(/^\w+-/);
  //var otherParts = someSubstring.match(/-[^-\s]+/g);
  var nameParts = someSubstring.match(/[^-\s]+/g); // Match all non-whitespace, non-hyphen strings of any length.
  //~ console.log('someSubstring = ' + someSubstring);
  if (nameParts.length == 1) {
    return nameParts[0];
  } else {
    var nameInitials = '';
    for (var i = 0; i < nameParts.length; i++) {
      nameInitials = nameInitials + nameParts[i].substring(0,1);
    }
    return nameInitials;
  }
};
  
bfun.initialHyphenName = function initialHyphenName(someSubstring) {
  var nameParts = someSubstring.match(/[^-\s]+/g); // Match all non-whitespace, non-hyphen strings of any length.
  var nameInitials = '';
  for (var i = 0; i < nameParts.length; i++) {
    nameInitials = nameInitials + nameParts[i].substring(0,1);
  }
  return nameInitials;
};

bfun.makeShortNameList = function makeShortNameList(fullName1, playerID) {
  var nameParts = fullName1.split( ' ' );
  if (nameParts.length == 1) { // If they only have one name, return an array of 2 elements, to not confuse with nicknames.
    var nameList = [
      bfun.shortenHyphenName(nameParts[0]), // JP / Nick
      nameParts[0] // Jean-Pierre / Nick
    ];
    return nameList;
  };
  var firstName1 = nameParts.shift();
  var firstName = bfun.shortenHyphenName(firstName1);
  var lastName = nameParts.pop();
  var lastInitials = bfun.initialHyphenName(lastName);
  var middleInitials = '';
  var middleNames = ' '; // middleNames has "surrounding" spaces.
  for (var i = 0; i < nameParts.length; i++) {
    middleInitials = middleInitials + nameParts[i].substring(0,1);
    middleNames = middleNames + nameParts[i] + ' ';
  }
  var nameList = [];
  nameList.push(firstName); // First name (or initials of hyphenated name only)
  nameList.push(firstName + ' ' + lastInitials); // First name + last initial(s)
  nameList.push(firstName + ' ' + lastName); // First name + last name
  nameList.push(firstName1); // Full hyphenated first name.
  nameList.push(firstName1 + ' ' + lastName); // Full hyphenated first name. Will be the same as firstName for most people?
  if (middleInitials.length > 0) {
    nameList.push(firstName + ' ' + middleInitials + ' ' + lastName); // First name + middle initial(s) + last name
  } else {
    nameList.push(firstName + ' ' + lastName); // This will cause another collision if all the players don't have middle names.
  }
  if (middleInitials.length > 0) {
    nameList.push(firstName1 + ' ' + middleInitials + ' ' + lastName); // First name + middle initial(s) + last name
  } else {
    nameList.push(firstName1 + ' ' + lastName); // This will cause another collision if all the players don't have middle names.
  }
  if (middleInitials.length > 0) { // If they have middle names, they will have middle initials
    nameList.push(firstName + middleNames + lastName); // First name + middle initial(s) + last name
  } else {
    nameList.push(firstName + ' ' + lastName); // This will cause another collision if all the players don't have middle names.
  }
  if (middleInitials.length > 0) { // If they have middle names, they will have middle initials
    nameList.push(firstName1 + middleNames + lastName); // First name + middle initial(s) + last name
  } else {
    nameList.push(firstName1 + ' ' + lastName); // This will cause another collision if all the players don't have middle names.
  }
  if (middleInitials.length > 0) { // Including player IDs will prevent all collisions.
    nameList.push(firstName1 + middleNames + lastName + ' ( ' + playerID + ' )' ); // First name + middle initial(s) + last name + ID
  } else {
    nameList.push(firstName1 + ' ' + lastName + ' ( ' + playerID + ' )' );
  }
  return nameList;
};

bfun.randomString = function randomString(strLength, charSet) {
  var result = [];
  strLength = strLength || 5;
  charSet = charSet || 'abcdefghijklmnopqrstuvwxyz0123456789';
  //charSet = charSet || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  while (result.length < strLength) {
    result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
  }
  return result.join( '' );
}

bfun.sanitize = function sanitize(anything) {
  return anything.toString().replace(/[^a-zA-Z\d\_]/g, '' );
};

bfun.tKey2tSchema = function tKey2tSchema(tKey) {
  return 'tournament' + bfun.sanitize(tKey.toLowerCase());
};

bfun.tSchema2tKey = function tSchema2tKey(tSchema) {
  return tSchema.substring(10, tSchema.length).toLowerCase();
};

bfun.generateNewSchema = function generateNewSchema(keyLength, schemaList) {
  var maxAttempts = Math.pow(36, keyLength);
  while (maxAttempts--) { // This should complete very quickly.
    var newKey = bfun.randomString(keyLength).toLowerCase();
    var newSchema = bfun.tKey2tSchema(newKey); // This is generated by us so can't contain a SQLi
    if (schemaList.indexOf(newSchema) == -1) {
      return newSchema;
    };
  };
  return false;
};

bfun.helloWorld = function () {
  console.log( 'Hello World' );
};

bfun.helloWorldN = function (n) {
  for (var i = 0; i < n; i++) {
    bfun.helloWorld();
  }
};

bfun.testCSV = function () {
  // It actually works properly though...
  console.log( 'Testing csvToObjects' );
  var someString = 'long_name,short_name\nChristopher,Chris\nDavid,Dave\nNicholas,Nick'
  var outArray1 = $.csv.toObjects(someString, {});
  var outArray2 = $.csv.toObjects(someString, {});
  console.log(outArray1);
  console.log(outArray2);
};

module.exports = bfun;

console.log( 'Loaded bfun' );
