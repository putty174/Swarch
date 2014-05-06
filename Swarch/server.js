var util = require("util");
var io = require("socket.io");
Player = require("./Player").Player;

var socket, players;
function init() {
    players = [];

    socket = io.listen(8000);
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
    client.on("move player", onMovePlayer);
};

function onClientDisconnect() {
    util.log("Player has disconnected:" + this.id);
};

function onLogin(data) {
    var name = data.username;
    var pass = data.password;
    util.log("Name: " + name);
    util.log("Pass:" + pass);

    if (name == "asdf")
        this.emit("verify", { success: true });
    else
        this.emit("verify", { success: false });
    util.log("emit done");
};

function onNewPlayer(data) {
    var newPlayer = new Player(data.x, data.y);
    newPlayer.id = this.id;

    this.broadcast.emit("new player", { id: newplayer.id, x: newPlayer.getX(), y: newPlayer.getY() });

    var i, existingPlayer;
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[0];
        this.emit("new player", { id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY() });
    };
    players.push(newPlayer);
};

function onMovePlayer(data) {
};

init();