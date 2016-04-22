// Requires
var fs = require( 'fs' );
// My requires
var $ = jQuery = require('jquery');
require('jquery-csv');

var csvOptions = {};

// This is an Object of functions which works because you can call
// object.keyName or object['keyName'] to access object elements.
// E.g. calling bfun.helloWorld() and bfun['helloWorld']() both work.
bfun = {};

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
  var outArray = $.csv.toObjects( someString, csvOptions );
  return outArray;
};
  
bfun.loadCSVFile = function ( somePath ) {
  var outArray = $.csv.toArrays( bfun.loadFile( somePath ), csvOptions );
  return outArray;
};
  
bfun.loadCSVObjectsFile = function ( somePath ) {
  var outArray = $.csv.toObjects( bfun.loadFile( somePath ), csvOptions );
  return outArray;
};
  
bfun.removeWhiteSpace = function ( someString ) {
  return someString.replace( /[\s\n\r]+/g, ' ' ).replace(/^\s|\s$/g, "");
};
  
bfun.trimAroundHyphen = function ( someString ) {
  var trimedOfSpaces = someString.replace( /[\s\n\r]+/g, ' ' ).replace( /^\s|\s$/g, '' );
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

module.exports = bfun;
