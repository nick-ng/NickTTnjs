// Requires
var fs = require( 'fs' );
var csv = require( 'csv' );
// My requires


module.exports = {
  
  loadCSV: function ( somePath ) {
    var outArray = [];
    fs.readFile(somePath, 'utf8', function ( err, data ) {
      if (err) {
        return console.log(err);
      }
      //console.log(data);
      csv.parse(data, {trim: true, auto_parse: true, comment: '#'}, function ( err, records ) {
        outArray = records;
      });
    });
    //console.log(outArray);
    //return outArray;
    //return outArray
  }, // Note this comma
  
  helloWorld: function () {
    console.log('Hello World');
  }

};
