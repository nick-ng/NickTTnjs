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
  
  helloWorld: function () {
    console.log('Hello World');
  } // Note this doesn't have a comma

};
