var app	= require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var crypto = require('crypto');





//io.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling', 'htmlfile', 'flashsocket']);
io.set('origins', '*:*');

var opts = {
	port: process.env.PORT || 8081
};

io.on('connection', function(socket) {
	socket.on('slidechanged', function(slideData) {
		if (typeof slideData.secret == 'undefined' || slideData.secret == null || slideData.secret === '') return;
		if (createHash(slideData.secret) === slideData.socketId) {
			slideData.secret = null;
			socket.broadcast.emit(slideData.socketId, slideData);
		};
	});
});

app.get("/token", function(req,res) {
	var ts = new Date().getTime();
	var rand = Math.floor(Math.random()*9999999);
	var secret = ts.toString() + rand.toString();

	var rand2 = Math.floor(Math.random()*9999999);
	var secret2 = rand2.toString() + ts.toString();

	res.send(
		"multiplex: " +
		JSON.stringify({
			secret: secret,
			id: createHash(secret),
			url: "cs105.cs.illinois.edu:8080"
		}) + "," +
		"<br>" +
		"paper: " +
		JSON.stringify({
			secret: secret2,
			id: createHash(secret2),
			url: "cs105.cs.illinois.edu:8080"
		})
	);
});

var createHash = function(secret) {
	var cipher = crypto.createCipher('blowfish', secret);
	return(cipher.final('hex'));
};

// Actually listen
server.listen(opts.port || null);

var brown = '\033[33m',
	green = '\033[32m',
	reset = '\033[0m';

console.log( brown + "classroom.js:" + reset + " Running on port " + green + opts.port + reset );
