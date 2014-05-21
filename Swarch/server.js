var util = require("util");
var io = require("socket.io");
var express = require("express");
var db = require("mongojs").connect("userdb", ["users"]);

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
    pellets.push(new pellet(width * 0.25, height * 0.25, 10, 10));
    pellets.push(new pellet(width * 0.25, height * 0.75, 10, 10));
    pellets.push(new pellet(width * 0.75, height * 0.25, 10, 10));
    pellets.push(new pellet(width * 0.75, height * 0.75, 10, 10));
    setEventHandlers();
};

//Pellet class
function pellet(x, y, w, h, speed, score, movex, movey, wait, idnum, t, latency) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 10;
    this.h = h || 10;
    this.speed = speed || 2;
    this.score = score || 0;
    this.dx = movex || 0;
    this.dy = movey || 0;
    this.wait = wait || 0;
    this.id = idnum || 0;
    this.time = t || Date.now();
    this.lag = latency || 0;
}

//Pellet die
pellet.prototype.die = function () {
    this.x = Math.min(width * Math.random(), width - 10);
    this.y = Math.min(height * Math.random(), height - 10);
    this.w = 10;
    this.h = 10;
    this.score = 0;
    this.speed = 2;
    this.dx = 0;
    this.dy = 0;
}

//Pellet eat another and grow
pellet.prototype.eat = function (target) {
    this.score++;
    this.x -= 1;
    this.y -= 1;
    this.w += 2;
    this.h += 2;
    this.speed *= 0.9;
    this.wait = (this.w - 10) / 2;
    target.die();
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
};

function onClientDisconnect() {
	var playerid = this.username;
    util.log("Player has disconnected:" + playerid);
	this.broadcast.emit("remove player", { id: playerid });
	delete players[playerid];
};

function onLogin(data) {
    var name = data.username;
    var pass = data.password;
    var temp = this;
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
	players[playerid] = new pellet(Math.min(width * Math.random(), width - 10), Math.min(height * Math.random(), height - 10), 10, 10, 2, 0);
	this.emit("setup", { id: playerid, x: players[playerid].x, y: players[playerid].y });
    
	for (var i = 0; i < pellets.length; i++) {
	    this.emit("new pellet", { x: pellets[i].x, y: pellets[i].y });
	}

    this.broadcast.emit("new player", { id: playerid, x: players[playerid].x, y: players[playerid].y });

	for (var id in players) {
		util.log("Sending data for " + id);
		this.emit("new player", { id: id, x: players[id].x, y: players[id].y });
	}
};

function onMove(data) {
	dir = data.direction;
	
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
	
    this.broadcast.emit("move", { id: data.id, direction: data.direction });
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
    //this.emit("my position", { x: players[data.id].x, y: players[data.id].y, dx: players[data.id].dx, dy: players[data.id].dy });
}

function checkWallCollisions() {
	//Check if run into wall
	for (var id in players) {
		if (players[id].x < 0 || (players[id].x + players[id].w) > width || players[id].y < 0 || (players[id].y + players[id].h) > height) {
			util.log("Wall Crash: " + id);
			players[id].x = (width + 10) / 2;
			players[id].y = (height + 10) / 2;
			players[id].dx = 0;
			players[id].dy = 0;
			sync();
		}
	}
}

function checkCollision(player, target) {
    //Check if run into target
    if (player.x <= (target.x + target.w) && target.x <= (player.x + player.w) && player.y <= (target.y + target.h) && target.y <= (player.y + player.h)) {
        if (player.score > target.score) {
            player.eat(target);
        }
        else if (player.score < target.score) {
            target.eat(player);
        }
        else {
            player.die();
            target.die();
        }
		sync();
    }
};

function sync() {
	for (var id in players) {
		socket.sockets.send("sync", { id: id, 
									  x: players[id].x, 
									  y: players[id].y, 
									  dx: players[id].dx,
									  dy: players[id].dy,
									  w: players[id].w,
									  h: players[id].h,
									  speed: players[id].speed,
									  score: players[id].score });
	}
};

var frameCount = 0;
var update = function () {
	checkWallCollisions();

	for (var id in players) {
	    players[id].x += players[id].dx;
	    players[id].y += players[id].dy;

	    //util.log("Position: " + id + " >>> " + players[id].x + ", " + players[id].y + " at " + players[id].speed);
		//util.log("lag: " + players[id].lag);

		for (var target in players) {
		    if (id != target)
		        checkCollision(players[id], players[target]);
		}

		for (var i = 0; i < 4; i++) {
			checkCollision(players[id], pellets[i]);
		}
	}
	
	if (++frameCount >= 60) {
		frameCount = 0;
		sync();
	}
};

init();
//Set game loop and framerate
setInterval(update, 1000 / 60);