var util = require("util");
var io = require("socket.io");
var express = require("express");
var db = require("mongojs").connect("userdb", ["users"]);
Player = require("./Player").Player;

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
    client.on("move", onMovePlayer);
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

function onNewPlayer(data) {
    var playerid = this.username;
	this.emit("setup", {id: playerid});
	util.log("New Player: " + playerid);
	players[playerid] = new Player(data.x, data.y);

    this.broadcast.emit("new player", { id: playerid, x: players[playerid].getX(), y: players[playerid].getY() });

	for (var id in players) {
		util.log("Sending data for " + id);
		this.emit("new player", { id: id, x: players[id].getX(), y: players[id].getY() });
	}
};

function onMovePlayer(data) {
	players[data.id].setDirection(data.direction);
    this.broadcast.emit("move player", { id: data.id, direction: data.direction });
};

init();
