// Requires
var fs = require( 'fs' );
// My requires
var $ = jQuery = require('jquery');
require('jquery-csv');

var fileOptions = 'utf8';
var csvOptions = {};

// This is an Object of functions which works because you can call
// object.keyName or object['keyName'] to access object elements.
// E.g. calling bfun.helloWorld() and bfun['helloWorld']() both work.
module.exports = {
  
  loadFile: function ( somePath ) {
    var outString = fs.readFileSync( somePath, fileOptions );
    return outString;
  }, // Note this comma
  
  loadCSV: function ( someString ) {
    var outArray = $.csv.toArrays( someString, csvOptions );
    return outArray;
  },
  
  loadCSVObjects: function ( someString ) {
    var outArray = $.csv.toObjects( someString, csvOptions );
    return outArray;
  },
  
  loadCSVFile: function ( somePath ) {
    var outArray = $.csv.toArrays( fs.readFileSync( somePath, fileOptions ), csvOptions );
    return outArray;
  },
  
  loadCSVObjectsFile: function ( somePath ) {
    var outArray = $.csv.toObjects( fs.readFileSync( somePath, fileOptions ), csvOptions );
    return outArray;
  },
  
  removeWhiteSpace: function ( someString ) {
    return someString.replace( /[\s\n\r]+/g, ' ' ).replace(/^\s|\s$/g, "");
  },
  
  trimAroundHyphen: function ( someString ) {
    var trimedOfSpaces = someString.replace( /[\s\n\r]+/g, ' ' ).replace( /^\s|\s$/g, '' );
    return trimedOfSpaces.replace( /(\s)*-(\s)*/g, '-' );
  },
  
  // Returns initials of a hyphenated name otherwise just returns the name.
  // e.g. Jean-Sébastien > JS
  shortenHyphenName: function ( someSubstring ) {
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
  },
  
  initialHyphenName: function ( someSubstring ) {
    var nameParts = someSubstring.match( /[^-\s]+/g ); // Match all non-whitespace, non-hyphen strings of any length.
    var nameInitials = '';
    for ( var i = 0; i < nameParts.length; i++ ) {
      nameInitials = nameInitials + nameParts[i].substring( 0,1 );
    }
    return nameInitials;
  },
  
  helloWorld: function () {
    console.log('Hello World');
  } // Note this doesn't have a comma

};
