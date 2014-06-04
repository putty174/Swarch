var message;

var socket = io.connect(location.hostname, { port: location.port, transports: ["websocket"] });

var setHandlers = false;

var check = "Confirming login...";  //Login Information check, haven't decided if 1/0, true/false, w/e.
var confirm = false;
var time = Date.now();
var messageTimeout;

var width = 600;    //Width of game screen
var height = 400;   //Height of game screen

var lastEvent;
var heldKeys = {}; // Currently pressed keys

var me; //Player
var enemies = {};   //Map of enemies (key: id, value: pellet)
var pellets = [];   //List of pellets on screen

//Set up area to draw game on. PLEASE DO NOT TOUCH!!!
var canvas = document.createElement("canvas");  
canvas.width = width;
canvas.height = height;
var ctx = canvas.getContext("2d");

var scoreboard = document.createElement("table");

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

function fillRanking() {
    var rankings = document.getElementById('ranking');
    var stop = rankings.rows.length;
    var i = 1;
    while (i != stop) {
        rankings.deleteRow(1);
        i++
    }

    var index = document.getElementById("num");
    var numbers = parseInt(index.options[index.selectedIndex].value);
    socket.emit('ranking', { num: numbers });
    if (!setHandlers) {
        setEventHandlers();
        setHandlers = true;
    }
}

function score() {
    var rankings = document.getElementById('ranking');
    var row = rankings.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);

    cell1.innerHTML = "1";
    cell2.innerHTML = "me";
    cell3.innerHTML = "9001";
}

//Setup script to prepare for game
function start() {
	var name = document.getElementById('name').value;
	var pass = document.getElementById('pass').value;
	var hashPass = CryptoJS.MD5(pass) + "";

	document.write("Name: " + name + "<br>");
	document.write("Pass: " + pass + "<br>");
	document.write("MD5 Hash: " + hashPass + "<br>");
	var logOut = document.createElement("BUTTON");
	var logOutText = document.createTextNode("Log Out");
	logOut.appendChild(logOutText);
	logOut.onclick = function () { document.location.reload(); };

	document.body.appendChild(logOut);
	document.write("<br>");
	document.body.appendChild(canvas);
	document.body.appendChild(scoreboard);

	socket.emit("login", { username: name, password: hashPass });

	setup();
	if (!setHandlers) {
	    setEventHandlers();
	    setHandlers = true;
	}
}

var setEventHandlers = function () {
    socket.on("connect", onSocketConnected);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("verify", onVerify);
	socket.on("setup", onSetup);
    socket.on("new player", onNewPlayer);
    socket.on("new pellet", onNewPellet);
    socket.on("sync", onSync);
    socket.on("remove player", onRemovePlayer);
    socket.on("ping", onPing);
    socket.on("ranking", onRanking);
};

function onRanking(data) {
    var rankings = document.getElementById('ranking');

    var row = rankings.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);

    cell1.innerHTML = data.pos;
    cell2.innerHTML = data.name;
    cell3.innerHTML = data.score;
}

function onSocketConnected() {
    console.log("Connected to socket server");
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};

function onVerify(data) {
    check = data.success;
	messageTimeout = 5;
    if (check == "good") {
        check = "Welcome back";
        confirm = true;
    }
    else if (check == "new") {
        check = "Hello new user";
        confirm = true;
    }
	else if (check == "duplicate") {
		alert("User currently logged in.");
		document.location.reload();
	}
    else {
        alert("Bad Username/Password.\nPlease try again.");
        document.location.reload();
    }
};

// Get player id and current state of game
function onSetup(data) {
    me = new pellet(data.x, data.y, 10, 10, "#00FF00", 100, 0, 0, 0);
	me.id = data.id;
	console.log("ID: " + me.id);

	var row = scoreboard.insertRow(-1);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);

	cell1.innerHTML = data.id;
	cell2.innerHTML = 0;
}

function onNewPlayer(data) {
	if (data.id != me.id) {
		console.log("New player connected: " + data.id);
		enemies[data.id] = new pellet(data.x, data.y, 10, 10, "#FF0000", 100, 0, 0, 0);

		var row = scoreboard.insertRow(-1);
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);

		cell1.innerHTML = data.id;
		cell2.innerHTML = 0;
	}
};

function onNewPellet(data) {
    console.log("New Pellet Created: " + data.newX + ", " + data.newY);
	if (pellets.length < 4) 
		pellets.push(new pellet(data.newX, data.newY, 10, 10, "#AAAAAA"));
	else {
		for (var i = 0; i < pellets.length; i++) {
			if (Math.abs(data.oldX - pellets[i].x) < 0.1 && Math.abs(data.oldY - pellets[i].y < 0.1)) {
				pellets[i].x = data.newX;
				pellets[i].y = data.newY;
				return;
			}
		}
	}
};


var syncIndex = 0;
function onSync(data) {
	var syncing;
	if (data.id == me.id) {
	    syncing = me;
	    syncIndex = 0;
	}
	else
	    syncing = enemies[data.id];

	syncing.x = data.x;
	syncing.y = data.y;
	syncing.dx = data.dx;
	syncing.dy = data.dy;
	syncing.score = data.score;
	
	syncing.w = 10 + (2 * syncing.score);
	syncing.h = 10 + (2 * syncing.score);
	syncing.speed = 100 * Math.pow(0.95, syncing.score);

	scoreboard.deleteRow(syncIndex);
	var row = scoreboard.insertRow(syncIndex);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);

	cell1.innerHTML = data.id;
	cell2.innerHTML = data.score;
	syncIndex++;
};

function onRemovePlayer(data){
	console.log("Player " + data.id + " has left the game.");
	delete enemies[data.id];
	scoreboard.deleteRow(scoreboard.rows.length - 1);
};

function onPing(data) {
    this.emit("pong", { id: me.id });
    lag = (Date.now() - time) / 2;
}

//Setup game by placing objects
var setup = function () {
    socket.emit("new player");
}

//Add pellets to list of pellets
var addPellet = function (pellet) {
    pellets.push(pellet);
}

//Pellet class
function pellet(x, y, w, h, fill, speed, score, movex, movey) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 10;
    this.h = h || 10;
    this.fill = fill || "#AAAAAA";
    this.speed = speed || 100;
    this.score = score || 0;
    this.dx = movex || 0;
    this.dy = movey || 0;
}

//Pellet helper function to draw pellet
pellet.prototype.draw = function (ctx) {
    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);
}

pellet.prototype.die = function() {
    this.x = (width + me.w) / 2;
    this.y = (height + me.h) / 2;
    this.w = 10;
    this.h = 10;
    this.score = 0;
    this.speed = 100;
	this.dx = 0;
	this.dy = 0;
}

// Eat player
pellet.prototype.eatPlayer = function (player) {
	if (player !== undefined) {
		this.score += player.score + 1;
		this.x -= player.score + 1;
		this.y -= player.score + 1;
		this.w += (player.score + 1) * 2;
		this.h += (player.score + 1) * 2;
		this.speed *= Math.pow(0.9, player.score + 1);
		player.die();
	}
}

//Check collision with walls or pellets
var checkCollide = function () {
    //Wall collision
    if (me.x < 0 || (me.x + me.w) > width || me.y < 0 || (me.y + me.h) > height) {
        me.die();
    }
}

//Reads input from keyboard and moves player accordingly
var update = function (currentFPS) {
    //checkCollide();

    if (confirm) {
        $(document).keydown(function(e) {
			if (lastEvent && lastEvent.keyCode == e.keyCode) {
				return;
			}
			lastEvent = e;
		
            if (e.keyCode == 37) {  //left
                me.dx = -me.speed;
                me.dy = 0;
				socket.emit("move", { id: me.id, direction: "left" });
            }
            else if (e.keyCode == 39) { //right
                me.dx = me.speed;
                me.dy = 0;
				socket.emit("move", { id: me.id, direction: "right" });
            }
            else if (e.keyCode == 38) { //up
                me.dx = 0;
                me.dy = -me.speed;
				socket.emit("move", { id: me.id, direction: "up" });
            }
            else if (e.keyCode == 40) { //down
                me.dx = 0;
                me.dy = me.speed;
				socket.emit("move", { id: me.id, direction: "down" });
            }
            else if (e.keyCode == 32) { //stop
                me.dx = 0;
                me.dy = 0;
				socket.emit("move", { id: me.id, direction: "stop" });
            }
        });
		
		$(document).keyup(function(e) {
			lastEvent = null;
		});
    }
	
	var deltaTime = 1 / currentFPS;

	me.x += me.dx * deltaTime;
	me.y += me.dy * deltaTime;
	
	
	for (var id in enemies) {
		enemies[id].x += enemies[id].dx * deltaTime;
		enemies[id].y += enemies[id].dy * deltaTime;
	}
}

//Render Loop
var render = function () {
    for(var i = 0; i < pellets.length; i++) {
        pellets[i].draw(ctx);
    }
    me.draw(ctx);
    for (var id in enemies) {
        enemies[id].draw(ctx);
    }
}

//Clears Screen to prepare for next draw
var clean = function () {
    ctx.fillStyle = "#0000C8";
    ctx.fillRect(0, 0, width, height);
}

//Starts ping check process
var ping = function () {
    if (Date.now() - time > 1000) {
        socket.emit("ping", { id: me.id });
		time = Date.now();
	}
}

//Main Game Loop
var main = function () {
	if (me !== undefined) {
		var currentFPS = fps.getFPS();
	
		clean();
		update(currentFPS);
		render();
		ping();
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.font = "10px Helvetica";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(me.score, me.x + (me.w / 2), me.y + (me.h / 2));
		for (var id in enemies) {
			ctx.fillText(enemies[id].score, enemies[id].x + (enemies[id].w / 2), enemies[id].y + (enemies[id].h / 2));
		}

		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "right";
		ctx.fillText(currentFPS + " FPS", canvas.width, 5);
		
		if (messageTimeout > 0) {
			ctx.font = "24px Helvetica";
			ctx.textAlign = "center";
			ctx.fillText(check, canvas.width / 2, canvas.height / 2);
			messageTimeout -= 1 / currentFPS;
		}
	}
}

//Set game loop and framerate
setInterval(main, 1000 / 60);