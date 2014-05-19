var util = require("util");
var io = require("socket.io");
var express = require("express");
var db = require("mongojs").connect("userdb", ["users"]);

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

//Pellet class
function pellet(x, y, w, h, fill, speed, score, movex, movey, wait, idnum) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 10;
    this.h = h || 10;
    this.fill = fill || "#AAAAAA";
    this.speed = speed || 2;
    this.score = score || 0;
    this.dx = movex || 0;
    this.dy = movey || 0;
    this.wait = wait || 0;
    this.id = idnum || 0;
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
};

function onClientDisconnect() {
    util.log("Player has disconnected:" + this.id);
    var i;
    for (i = 0; i < players.length; i++) {
        if (players[i].id == this.id)
            players.splice(i, 1);
    }
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

//Creates and adds new players to list of connected players
function onNewPlayer(data) {
    //Checks if this id sent a new player message before to prevent duplicates
    var i, exists;
    exists = false;
    for(i = 0; i < players.length; i++){
        if (players[i].id == this.id) {
            exists = true;
            util.log("Player already exists");
        }
    }

    //If truely new player, create new entry and send other player info
    if (!exists) {
        util.log("Creating new player for " + this.id + data.x + data.y);
        var newPlayer = new pellet();
        newPlayer.id = this.id;
        
        //newPlayer.x = data.x;
        //newPlayer.y = data.y;
        newPlayer.x = data.x;
        newPlayer.y = data.y;
        newPlayer.speed = 2;

        this.broadcast.emit("new player", { id: newPlayer.id, x: newPlayer.x, y: newPlayer.y, fill: newPlayer.fill });
        var i, existingPlayer;
        for (i = 0; i < players.length; i++) {
            existingPlayer = players[i];
            this.emit("existing player", { id: existingPlayer.id, x: existingPlayer.x, y: existingPlayer.y, speed: existingPlayer.speed });
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

function findPlayer(id) {
    var i, player;
    player = false;
    for (i = 0; i < players.length; i++) {
        if (players[i].id == id) {
            player = players[i];
            return player;
        }
    }
    return player;
}

function onMove(data) {
    var player = findPlayer(this.id);
    var dx, dy;
    if (data.direction == 37) {  //left
        player.dx = -player.speed;
        player.dy = 0;
    }
    else if (data.direction == 39) { //right
        player.dx = player.speed;
        player.dy = 0;
    }
    else if (data.direction == 38) { //up
        player.dx = 0;
        player.dy = -player.speed;
    }
    else if (data.direction == 40) { //down
        player.dx = 0;
        player.dy = player.speed;
    }
    else if (data.direction == 32) {
        player.dx = 0;
        player.dy = 0;
    }
    util.log(player.id + " >>> " + player.x + ", " + player.y + ", " + player.dx + ", " + player.dy);
    this.emit("my position",{x: player.x, y: player.y, dx: player.dx, dy: player.dy });
    var i, existingPlayer;
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[i];
        this.broadcast.emit("move", { id: existingPlayer.id, x: existingPlayer.x, y: existingPlayer.y, dx: existingPlayer.dx, dy: existingPlayer.dy });
        if (existingPlayer.id == this.id)
            existingPlayer.direction = data.direction;
    };
};

var main = function () {
    var i;
    for (i = 0; i < players.length; i++) {
        players[i].x += players[i].dx;
        players[i].y += players[i].dy;
        //util.log(players[i].id + " >>> " + players[i].x + ", " + players[i].y);
        if (players[i].x < 0 || players[i].y > width || players[i].y < 0 || players[i].y > height) {
            players[i].x = (width + 10) / 2;
            players[i].y = (height + 10) / 2;
        }
    }
}

init();

setInterval(main, 1000 / 60);