var util = require("util");
var io = require("socket.io");
var express = require("express");
var db = require("mongojs").connect("userdb", ["users", "scores"]);

var app = express();
// Sets default directory for files
// Ex. __dirname + '/public' would set the public folder as the top folder
app.use(express.static(__dirname));

// Send __dirname/index.htm to client
app.get('/', function (req, res) {
	res.sendfile('index.htm');
});

// Start listening on socket
var server = app.listen(8000);
var socket = io.listen(server);
var time = Date.now();
var now = Date.now();
var width = 600;
var height = 400;

var players = {};
var pellets = [];

function init() {

    socket.configure(function () {
        socket.set("transports", ["websocket"]);
        socket.set("log level", 2);
    });
    pellets.push(new pellet(width * 0.25, height * 0.25, 10, 10, 0, -1));
    pellets.push(new pellet(width * 0.25, height * 0.75, 10, 10, 0, -1));
    pellets.push(new pellet(width * 0.75, height * 0.25, 10, 10, 0, -1));
    pellets.push(new pellet(width * 0.75, height * 0.75, 10, 10, 0, -1));
    setEventHandlers();
};

//Pellet class
function pellet(x, y, w, h, speed, score, movex, movey, latency) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 10;
    this.h = h || 10;
    this.speed = speed || 100;
    this.score = score || 0;
    this.dx = movex || 0;
    this.dy = movey || 0;
    this.lag = latency || 0;
}

//Pellet die
pellet.prototype.die = function () {
    this.x = Math.min(width * Math.random(), width - 10);
    this.y = Math.min(height * Math.random(), height - 10);
    this.w = 10;
    this.h = 10;
    this.score = 0;
    this.speed = 100;
    this.dx = 0;
    this.dy = 0;
    sync();
}

//Pellet eat another and grow
pellet.prototype.eat = function (target) {
	if (target.score >= 0) {
		this.score += 10;
		this.x -= 10;
		this.y -= 10;
		this.w += 20;
		this.h += 20;
		this.speed *= Math.pow(0.95, 10);
	} else {
		this.score++;
		this.x -= 1;
		this.y -= 1;
		this.w += 2;
		this.h += 2;
		this.speed *= 0.95;
	}
    this.wait = (this.w - 10) / 2;
	sync();
}

var setEventHandlers = function(){
    socket.sockets.on("connection", onSocketConnection);
};

function onSocketConnection(client){
    util.log("New player has connected: " + client.id);
    client.on("disconnect", onClientDisconnect);
    client.on("login", onLogin);
    client.on("new player", onNewPlayer);
    client.on("eat", onEat);
    client.on("move", onMove);
    
    client.on("ping", onPing);
    client.on("pong", onPong);

    client.on("ranking", onRanking);
};

function onRanking(data) {
    temp = this;
    util.log("Ranking recieved: " + data.num);
    db.scores.find().sort({ score: -1 }, function (err, docs) {
        var i;
        for (i = 0; i < docs.length && i < data.num; i++) {
            temp.emit("ranking", { pos: (i + 1), name: docs[i].user, score: docs[i].score });
            util.log((i + 1) + " of " + docs.length + " >> " + docs[i].user + ": " + docs[i].score);
        }
    });
}

function onClientDisconnect() {
	var playerid = this.username;
    util.log("Player has disconnected:" + playerid);
	this.broadcast.emit("remove player", { id: playerid });
	db.scores.remove({ user: playerid });
	delete players[playerid];
	sync();
};

function onLogin(data) {
    var name = data.username;
    var pass = data.password;
    var temp = this;
	
	if (players[name]) {
		temp.emit("verify", { success: "duplicate" });
		return;
	}
	
	this.username = name;
    
    util.log("Name: " + name);
    util.log("Pass:" + pass);
	
	db.users.count({user: name}, function(err, count) {
		if (count == 0) {
			db.users.save({user: name, password: pass});
			util.log("Registered new user: " + name);
			temp.emit("verify", { success: "new" });
		}
		else {
			db.users.find({user: name}, function(err, users) {
				if (pass == users[0].password)
					temp.emit("verify", { success: "good" });
				else
					temp.emit("verify", { success: "bad" });
			});
		}
	});
};

//Creates and adds new players to list of connected players
function onNewPlayer(data) {
    var playerid = this.username;
	util.log("New Player: " + playerid);
	players[playerid] = new pellet(Math.min(width * Math.random(), width - 10), Math.min(height * Math.random(), height - 10), 10, 10, 100, 0);
	db.scores.update({ user: playerid }, { $set: { score: 0 } }, { upsert: true });
	this.emit("setup", { id: playerid, x: players[playerid].x, y: players[playerid].y });
    
	for (var i = 0; i < pellets.length; i++) {
	    this.emit("new pellet", { newX: pellets[i].x, newY: pellets[i].y });
	}

    this.broadcast.emit("new player", { id: playerid, x: players[playerid].x, y: players[playerid].y });

	for (var id in players) {
		util.log("Sending data for " + id);
		this.emit("new player", { id: id, x: players[id].x, y: players[id].y });
	}
	
	sync();
};

function onMove(data) {
	dir = data.direction;
	players[data.id].direction = dir;
	
	if (dir == "left") {  //left
		players[data.id].dx = -players[data.id].speed;
		players[data.id].dy = 0;
	}
	else if (dir == "right") { //right
		players[data.id].dx = players[data.id].speed;
		players[data.id].dy = 0;
	}
	else if (dir == "up") { //up
		players[data.id].dx = 0;
		players[data.id].dy = -players[data.id].speed;
	}
	else if (dir == "down") { //down
		players[data.id].dx = 0;
		players[data.id].dy = players[data.id].speed;
	}
	else if (dir == "stop") { //stop
		players[data.id].dx = 0;
		players[data.id].dy = 0;
	}
	
	sync();
};

function onEat(data) {
    util.log("Eat");
    checkCollision(data.id, data.target);
};

function onPing(data) {
    players[data.id].time = Date.now();
    this.emit("ping");
}

function onPong(data) {
    players[data.id].lag = (Date.now() - players[data.id].time) / 2;
}

function checkWallCollisions() {
	//Check if run into wall
	for (var id in players) {
		if (players[id].x < 0 || (players[id].x + players[id].w) > width || players[id].y < 0 || (players[id].y + players[id].h) > height) {
			util.log("Wall Crash: " + id);
			players[id].die();
		}
	}
}

function checkCollision(player, target) {
    //Check if run into target
    if (player.x <= (target.x + target.w) && target.x <= (player.x + player.w) && player.y <= (target.y + target.h) && target.y <= (player.y + player.h)) {
        if (player.score > target.score) {
            player.eat(target);
			target.die();
        }
        else if (player.score < target.score) {
            target.eat(player);
			player.die();
        }
        else {
            player.die();
            target.die();
        }
    }
};

function checkPellets(player) {
	for (var i = 0; i < pellets.length; i++) {
        if (player.x <= (pellets[i].x + pellets[i].w) && pellets[i].x <= (player.x + player.w) && player.y <= (pellets[i].y + pellets[i].h) && pellets[i].y <= (player.y + player.h)) {
            player.eat(i);
			var oldX = pellets[i].x;
			var oldY = pellets[i].y;
			pellets[i].x = Math.min(width * Math.random(), width - 10);
			pellets[i].y = Math.min(height * Math.random(), height - 10);
			socket.sockets.emit("new pellet", { oldX: oldX, oldY: oldY, newX: pellets[i].x, newY: pellets[i].y });
        }
	}
};

function sync() {
	for (var id in players) {
		//util.log("Syncing " + id);
		socket.sockets.emit("sync", { id: id, 
									  x: players[id].x, 
									  y: players[id].y, 
									  dx: players[id].dx,
									  dy: players[id].dy,
									  score: players[id].score });
		db.scores.update({ user: id }, { $set: { score: players[id].score } });
	}
};

// FPS Counter
var fps = {
	startTime : 0,
	frameNumber : 0,
	getFPS : function(){
		this.frameNumber++;
		var d = new Date().getTime(),
			currentTime = ( d - this.startTime ) / 1000,
			result = Math.floor( ( this.frameNumber / currentTime ) );

		if( currentTime > 1 ){
			this.startTime = new Date().getTime();
			this.frameNumber = 0;
		}
		return result;
	}	
};

var frameCount = 0;
var update = function () {
	var currentFPS = fps.getFPS();
	//util.log(currentFPS + "FPS");
	checkWallCollisions();

	var deltaTime = 1 / currentFPS;
	for (var id in players) {
	    players[id].x += players[id].dx * deltaTime;
	    players[id].y += players[id].dy * deltaTime;

		for (var target in players) {
		    if (id != target)
		        checkCollision(players[id], players[target]);
		}

		checkPellets(players[id]);
	}
};

init();
//Set game loop and framerate
setInterval(update, 1000 / 60);