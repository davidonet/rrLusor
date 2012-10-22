//setup Dependencies
var connect = require('connect'), express = require('express'), io = require('socket.io'), port = (process.env.PORT || 8081);
var redis = require("redis");
var red = redis.createClient(9151, "sole.redistogo.com");
red.auth("961ff07cfecdb6e376f0d13ecb983927");

//Setup Express
var server = express.createServer();
server.configure(function() {
	server.set('views', __dirname + '/views');
	server.set('view options', {
		layout : false
	});
	server.use(connect.bodyParser());
	server.use(express.cookieParser());
	server.use(express.session({
		secret : "shhhhhhhhh!"
	}));
	server.use(connect.static(__dirname + '/static'));
	server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next) {
	if ( err instanceof NotFound) {
		res.render('404.jade', {
			locals : {
				title : '404 - Not Found',
				description : '',
				author : ''

			},
			status : 404
		});
	} else {
		res.render('500.jade', {
			locals : {
				title : 'The Server Encountered an Error',
				description : '',
				author : '',
				error : err
			},
			status : 500
		});
	}
});
server.listen(port);
var words = ["foin", "de", "l’aboli", "bibelot", "désormais", " préfère", "l’ortie", "pour", "juste", "ce qu’il faut", "d’émoi", "monotone", "comme", "l’émoi", "de", "ta", "conscience", "bibelot", "se frotte", "ton", "cœur", "aux", "orties", "sinon", "qu’en", "convive", "aux", "orties", "tu", "ne", "combattrais", "ton", "émoi", "que", "d’une", "bible", "en", "bibelots"];
red.on("connect", function() {
	words.forEach(function(w, i) {
		red.hset("w" + i, 'w', w);
		red.hset("w" + i, "left", Math.round((Math.random() * 1280 * 100) / 100));
		red.hset("w" + i, "top", Math.round((Math.random() * 720 * 100) / 100));
	});
});

//Setup Socket.IO
var io = io.listen(server);
io.sockets.on('connection', function(socket) {
	socket.on('position', function(data) {
		socket.broadcast.emit('position', data);
		red.hset(data.id,"left",data.pos.left);
		red.hset(data.id,"top",data.pos.top);
	});
	socket.on('disconnect', function() {
	});
});

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req, res) {
	var multi = red.multi();
	var myWords = [];
	words.forEach(function(w, i) {
		multi.hgetall("w" + i, function(err, ret) {
			ret.id = "w" + i;
			myWords.push(ret);
		});
	});
	multi.exec(function(err, ret) {
		res.render('index.jade', {
			locals : {
				title : 'Poème Magnétique',
				description : 'Your Page Description',
				author : 'Your Name',
				words : myWords
			}
		});
	});
});

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res) {
	throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res) {
	throw new NotFound;
});

function NotFound(msg) {
	this.name = 'NotFound';
	Error.call(this, msg);
	Error.captureStackTrace(this, arguments.callee);
}

console.log('Listening on http://0.0.0.0:' + port);