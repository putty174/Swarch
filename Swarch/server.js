var util = require("util");
var io = require("socket.io");
var express = require("express");
var db = require("mongojs").connect("userdb", ["users"]);
Player = require("./Player").Player;

var width = 600;
var height = 400;

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
var players = {};

function init() {

    socket.configure(function () {
        socket.set("transports", ["websocket"]);
        socket.set("log level", 2);
    });

    setEventHandlers();
};

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
	players[playerid] = new Player();
	players[playerid].setX(Math.min(width * Math.random(), width - 10));
    players[playerid].setY(Math.min(height * Math.random(), height - 10));
	this.emit("setup", { id: playerid, x: players[playerid].getX(), y: players[playerid].getY() });

    this.broadcast.emit("new player", { id: playerid, x: players[playerid].getX(), y: players[playerid].getY() });

	for (var id in players) {
		util.log("Sending data for " + id);
		this.emit("new player", { id: id, x: players[id].getX(), y: players[id].getY() });
	}
};

function onMove(data) {
	players[data.id].setDirection(data.direction);
    this.broadcast.emit("move", { id: data.id, direction: data.direction });
};

function onEat(data) {
    util.log("Eat");
    checkCollision(data.id, data.target);
};

function checkCollision(player, target) {
    util.log("Collide");
};

var main = function() {
	for (var id in players) {
		players[id].update();
	}
};

//Set game loop and framerate
setInterval(main, 1000 / 60);
init();