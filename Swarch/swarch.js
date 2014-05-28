var message;

var socket;

var check = "Confirming login...";  //Login Information check, haven't decided if 1/0, true/false, w/e.
var confirm = false;
var time = Date.now();
var lag;

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
	
	socket = io.connect("localhost", { port: 8000, transports: ["websocket"] });
	//socket = io.connect("98.164.217.165", { port: 8000, transports: ["websocket"] });   //Max IP address
	socket.emit("login", { username: name, password: hashPass });

	setup();
	setEventHandlers();
}

var setEventHandlers = function () {
    socket.on("connect", onSocketConnected);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("verify", onVerify);
	socket.on("setup", onSetup);
    socket.on("new player", onNewPlayer);
    socket.on("new pellet", onNewPellet);
    socket.on("sync", onSync);
    socket.on("move", onMove);
    socket.on("remove player", onRemovePlayer);
	socket.on("ping", onPing);
    //socket.on("pong", onPong);
};

function onSocketConnected() {
    console.log("Connected to socket server");
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};

function onVerify(data) {
    check = data.success;
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
    me = new pellet(data.x, data.y, 10, 10, "#00FF00", 2, 0, 0, 0, 0);
	me.id = data.id;
	console.log("ID: " + me.id);
}

function onNewPlayer(data) {
	if (data.id != me.id) {
		console.log("New player connected: " + data.id);
		enemies[data.id] = new pellet(data.x, data.y, 10, 10, "#FF0000", 2, 0, 0, 0, 0);
	}
};

function onMove(data) {
	if (data.id != me.id) {
		dir = data.direction;
		if (dir == "left") {  //left
			enemies[data.id].dx = -enemies[data.id].speed;
			enemies[data.id].dy = 0;
		}
		else if (dir == "right") { //right
			enemies[data.id].dx = enemies[data.id].speed;
			enemies[data.id].dy = 0;
		}
		else if (dir == "up") { //up
			enemies[data.id].dx = 0;
			enemies[data.id].dy = -enemies[data.id].speed;
		}
		else if (dir == "down") { //down
			enemies[data.id].dx = 0;
			enemies[data.id].dy = enemies[data.id].speed;
		}
		else if (dir == "stop") { //stop
			enemies[data.id].dx = 0;
			enemies[data.id].dy = 0;
		}
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

function onSync(data) {
	var syncing;
	if (data.id == me.id)
		syncing = me;
	else
		syncing = enemies[data.id];

	syncing.lastX = syncing.x;
	syncing.lastY = syncing.y;
	syncing.frame = 0;

	syncing.x = data.x;
	syncing.y = data.y;
	syncing.dx = data.dx;
	syncing.dy = data.dy;
	syncing.w = data.w;
	syncing.h = data.h;
	syncing.speed = data.speed;
	syncing.score = data.score;
};

function onRemovePlayer(data){
	console.log("Player " + data.id + " has left the game.");
	delete enemies[data.id];
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
function pellet(x, y, w, h, fill, speed, score, movex, movey, wait, lx, ly, f) {
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

    this.lastX = lx || 0;
    this.lastY = ly || 0;
    this.frame = f || 0;
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
    this.speed = 2;
	this.dx = 0;
	this.dy = 0;
}

pellet.prototype.eat = function (i) {
	this.score++;
    pellets.splice(i, 1);
	this.x -= 1;
	this.y -= 1;
    this.w += 2;
    this.h += 2;
    this.speed *= 0.9;
    this.wait = (this.w - 10) / 2;
    //addPellet(new pellet(Math.min(width * Math.random(), width - 10), Math.min(height * Math.random(), height - 10), 10, 10, "#AAAAAA"));
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
		this.wait = (this.w - 10) / 2;
		player.die();
	}
}

//Check collision with walls or pellets
var checkCollide = function () {

    //Wall collision
    if (me.x < 0 || (me.x + me.w) > width || me.y < 0 || (me.y + me.h) > height) {
        me.die();
    }
	/*
    if (enemy.x < 0 || (enemy.x + enemy.w) > width || enemy.y < 0 || (enemy.y + enemy.h) > height) {
        enemy.die();
    }
	
    //Check collision between players
    var i;
    for (i = 0; i < enemies.length; i++) {
        if (me.x <= (enemies[i].x + enemies[i].w) && enemies[i].x <= (me.x + me.w) && me.y <= (enemies[i].y + enemies[i].h) && enemies[i].y <= (me.y + me.h)) {
            if (me.score > enemies[i].score) {
                me.eatPlayer(enemies[i]);
            }
            else if (me.score < enemies[i].score) {
                enemies[i].eatPlayer(me);
            }
            else {
                me.die();
                enemies[i].die();
            }
        }
    }
	*/

		/*
    //Collision with pellets
    for (var i = 0; i < pellets.length; i++) {
        if (me.x <= (pellets[i].x + pellets[i].w) && pellets[i].x <= (me.x + me.w) && me.y <= (pellets[i].y + pellets[i].h) && pellets[i].y <= (me.y + me.h)) {
            me.eat(i);
        }
        if (enemy.x <= (pellets[i].x + pellets[i].w) && pellets[i].x <= (enemy.x + enemy.w) && enemy.y <= (pellets[i].y + pellets[i].h) && pellets[i].y <= (enemy.y + enemy.h)) {
            enemy.eat(i);
        }
    }
		*/
}

//Reads input from keyboard and moves player accordingly
var update = function () {
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

    if (me.frame > 0) {
        me.x += (me.x - me.lastX) / (1 + me.frame);
        me.y += (me.y - me.lastY) / (1 + me.frame);
    }

    //if (me.wait < 0) {
    //    me.x += me.dx;
    //    me.y += me.dy;
    //}
    //me.wait -= 10;
	
	
	for (var id in enemies) {
		if (enemies[id].wait < 0) {
			enemies[id].x += enemies[id].dx;
			enemies[id].y += enemies[id].dy;
		}
		enemies[id].wait -= 10;
	}
}

//Render Loop
var render = function () {
    for(var i = 0; i < pellets.length; i++) {
        pellets[i].draw(ctx);
    }
    me.draw(ctx);
    me.frame++;
    message = me.frame;
    for (var id in enemies) {
        enemies[id].draw(ctx);
        enemies[id].frame++;
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

var messageTimeout = 0;
//Main Game Loop
var main = function () {
	if (me !== undefined) {
		clean();
		update();
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
		ctx.fillText(fps.getFPS() + " FPS", canvas.width, 5);

		//if (++messageTimeout < 60*5) {
		//	message = "(" + me.x + ", " + me.y + ") at " + me.speed;
		//	ctx.font = "24px Helvetica";
		//	ctx.textAlign = "center";
		//	ctx.fillText(check, canvas.width / 2, canvas.height / 2);
		//	//ctx.fillText(message, canvas.width / 2, canvas.height / 3);
		//}
	}
}

//Set game loop and framerate
setInterval(main, 1000 / 60);