var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var pagedir = __dirname + '/pages';

app.set('port', (process.env.PORT || 3434));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(pagedir + '/playerdetails.html');
  //res.send('<h1>Hello World</h1>');
});

http.listen(app.get('port'), function(){
  console.log('listening on : ' + app.get('port'));
});
