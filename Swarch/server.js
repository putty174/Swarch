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
    client.on("eat", onEat);
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
    var i, exists;
    exists = false;
    for(i = 0; i < players.length; i++){
        if (players[i].id == data.id) {
            exists = true;
            util.log("Player already exists");
        }
    }

    if (!exists) {
        util.log("Creating new player");
        var newPlayer = new Player();
        newPlayer.id = this.id;
        newPlayer.x = Math.min(width * Math.random(), width - 10);
        newPlayer.y = Math.min(height * Math.random(), height - 10);

        this.broadcast.emit("new player", { id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), fill: newPlayer.getFill() });
        var i, existingPlayer;
        for (i = 0; i < players.length; i++) {
            existingPlayer = players[i];
            this.emit("new player", { id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY() });
        };
        players.push(newPlayer);
    }
};

function onEat(data) {
    util.log("Eat");
    checkCollision(data.id, data.target);
}

function checkCollision(player, target) {
    util.log("Collide");
}

function onMove(data) {
    util.log("Move: " + data.id + " >>> " + data.direction);
    var dx, dy;
    if (data.direction == 37) {  //left
        dx = -1;
        dy = 0;
    }
    else if (data.direction == 39) { //right
        dx = 1;
        dy = 0;
    }
    else if (data.direction == 38) { //up
        dx = 0;
        dy = -1;
    }
    else if (data.direction == 40) { //down
        dx = 0;
        dy = 1;
    }
    else if (data.direction == 32) {
        dx = 0;
        dy = 0;
    }
    var i, existingPlayer;
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[i];
        this.emit("move", { id: existingPlayer.id, dx: data.direction });
        if (existingPlayer.id == this.id)
            existingPlayer.direction = data.direction;
    };
};

init();