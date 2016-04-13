// Requires
var fs = require( 'fs' );
// My requires
var $ = jQuery = require('jquery');
require('jquery-csv');

var fileOptions = 'utf8';
var csvOptions = {};

module.exports = {
  
  loadFile: function ( somePath ) {
    var outString = fs.readFileSync( somePath, fileOptions );
    return outString;
  }, // Note this comma
  
  loadCSV: function ( someString ) {
    var outArray = $.csv.toArrays( someString, csvOptions );
    return outArray;
  },
  
  loadCSVFile: function ( somePath ) {
    var outArray = $.csv.toArrays( fs.readFileSync( somePath, fileOptions ), csvOptions );
    return outArray;
  },
  
  helloWorld: function () {
    console.log('Hello World');
  } // Note this doesn't have a comma

};
