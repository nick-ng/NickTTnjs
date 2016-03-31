var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 3434));

app.get('/', function(req, res){
  //res.sendFile(__dirname + '/index.html');
  res.send('<h1>Hello World</h1>');
});

http.listen(app.get('port'), function(){
  console.log('listening on : ' + app.get('port'));
});
