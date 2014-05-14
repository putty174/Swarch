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
var players = [];

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
    client.on("move", onMove);
};

function onClientDisconnect() {
    util.log("Player has disconnected:" + this.id);
};

function onLogin(data) {
    var name = data.username;
    var pass = data.password;
	var temp = this;
    
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
    var newPlayer = new Player(data.fill);
    newPlayer.id = this.id;

    this.broadcast.emit("new player", { id: newplayer.id, x: newPlayer.getX(), y: newPlayer.getY() });

    var i, existingPlayer;
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[i];
        this.emit("new player", { id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY() });
    };
    players.push(newPlayer);
};

function onMove(data) {
    var i, existingPlayer;
    for (i = 0; i < players.length; i++) {
        existingPlayer = player[i];
        this.emit("move", { id: existingPlayer.id, direction: data.direction });
        if (existingPlayer.id == this.id)
            existingPlayer.direction = data.direction;
    };
};

init();