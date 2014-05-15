var socket;

var check = "Confirming login...";  //Login Information check, haven't decided if 1/0, true/false, w/e.
var confirm = false;

var width = 600;    //Width of game screen
var height = 400;   //Height of game screen

var key; // Currently pressed key

var me; //Player
var enemies = [];   //List of enemies
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
	
	socket = io.connect("http://localhost", { port: 8000, transports: ["websocket"] });
	socket.emit("login", { username: name, password: hashPass });

	setEventHandlers();

	setup();
}

var setEventHandlers = function () {
    socket.on("connect", onSocketConnected);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("verify", onVerify);
    socket.on("new player", onNewPlayer);
    socket.on("new pellet", onNewPellet);
    socket.on("move", onMovePlayer);
    socket.on("remove player", onRemovePlayer);
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
    else {
        alert("Bad Username/Password.\nPlease try again.");
        document.location.reload();
    }
    if (confirm)
        socket.emit("new player", { fill: "#FF0000" });
};

function onNewPlayer(data) {
    console.log("New player created: " + data.id);
    var newPlayer = new pellet(data.x, data.y, 10, 10, "#FF0000", 2, 0, 0, 0, 0, data.id);
    enemies.push(newPlayer);
};

function onNewPellet(data) {
    console.log("New Pellet Created: " + data.x + ", " + data.y);
    var newPellet = new pellet(data.x, data.y, 10, 10, "#AAAAAA");
    pellets.push(newPellet);
};

function onMove(data) {
    var player = findPlayer(data.id);
    if (!player)
        console.log("Player not found: " + data.id);
    else {
        player.dx *= data.dx;
        player.dy *= data.dy;
    }
};

function onRemovePlayer(data){
};

function findPlayer(id) {
    var i, player;
    player = false;
    for (i = 0; i < enemies.length; i++) {
        if (enemies[i].id == id) {
            player = enemies[i];
            return player;
        }
    }
    return player;
}

//Setup game by placing objects
var setup = function () {
    me = new pellet(width / 3, height / 3, 10, 10, "#00FF00", 2, 0, 0, 0, 0);
    enemy = new pellet(width * 2 / 3, height * 2 / 3, 10, 10, "#FF0000", 2, 0, 0, 0, 0, 1);

    addPellet(new pellet(width * 0.25, height * 0.25, 10, 10, "#AAAAAA"));
    addPellet(new pellet(width * 0.25, height * 0.75, 10, 10, "#AAAAAA"));
    addPellet(new pellet(width * 0.75, height * 0.25, 10, 10, "#AAAAAA"));
    addPellet(new pellet(width * 0.75, height * 0.75, 10, 10, "#AAAAAA"));
}

//Add pellets to list of pellets
var addPellet = function (pellet) {
    pellets.push(pellet);
}

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

//Pellet helper function to draw pellet
pellet.prototype.draw = function (ctx) {
    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.font = "10px Helvetica";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.score, this.x + (this.w / 2), this.y + (this.h / 2));
}

pellet.prototype.die = function() {
	this.x = Math.min(width * Math.random(), width - 10);
    this.y = Math.min(height * Math.random(), height - 10);
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
    addPellet(new pellet(Math.min(width * Math.random(), width - 10), Math.min(height * Math.random(), height - 10), 10, 10, "#AAAAAA"));
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
    if (enemy.x < 0 || (enemy.x + enemy.w) > width || enemy.y < 0 || (enemy.y + enemy.h) > height) {
        enemy.die();
    }

    //Check collision between players
    if (me.x <= (enemy.x + enemy.w) && enemy.x <= (me.x + me.w) && me.y <= (enemy.y + enemy.h) && enemy.y <= (me.y + me.h)) {
    	if (me.score > enemy.score) {
			me.eatPlayer(enemy);
    	}
		else if (me.score < enemy.score) {
			enemy.eatPlayer(me);
		}
		else {
			me.die();
			enemy.die();
		}
    }

    //Collision with pellets
    for (var i = 0; i < pellets.length; i++) {
        if (me.x <= (pellets[i].x + pellets[i].w) && pellets[i].x <= (me.x + me.w) && me.y <= (pellets[i].y + pellets[i].h) && pellets[i].y <= (me.y + me.h)) {
            me.eat(i);
        }

        if (enemy.x <= (pellets[i].x + pellets[i].w) && pellets[i].x <= (enemy.x + enemy.w) && enemy.y <= (pellets[i].y + pellets[i].h) && pellets[i].y <= (enemy.y + enemy.h)) {
            enemy.eat(i);
        }
    }
}

//Reads input from keyboard and moves player accordingly
var update = function () {
    checkCollide();
	/*
	$(document).keydown(function(e){
		keys[e.keyCode] = true;
	});
	$(document).keyup(function(e){
		keys[e.keyCode] = false;
	});
	
	if (keys[37]) {
		dx = -speed;
	}
	else if (keys[39]) {
		dx = speed;
	}
	else {
		dx = 0;
	}
	if (keys[38]) {
		dy = -speed;
	}
	else if (keys[40]) {
		dy = speed;
	}
	else {
		dy = 0;
	}
	*/

    if (confirm) {
        $(document).keydown(function (e) {
            key = e.keyCode;
            if (e.keyCode == 37) {  //left
                me.dx = -me.speed;
                me.dy = 0;
            }
            else if (e.keyCode == 39) { //right
                me.dx = me.speed;
                me.dy = 0;
            }
            else if (e.keyCode == 38) { //up
                me.dx = 0;
                me.dy = -me.speed;
            }
            else if (e.keyCode == 40) { //down
                me.dx = 0;
                me.dy = me.speed;
            }
            else if (e.keyCode == 32) {
                me.dx = 0;
                me.dy = 0;
            }
            else if (e.keyCode == 65) { //left
                enemy.dx = -enemy.speed;
                enemy.dy = 0;
            }
            else if (e.keyCode == 68) { //right
                enemy.dx = enemy.speed;
                enemy.dy = 0;
            }
            else if (e.keyCode == 87) { //up
                enemy.dx = 0;
                enemy.dy = -enemy.speed;
            }
            else if (e.keyCode == 83) { //down
                enemy.dx = 0;
                enemy.dy = enemy.speed;
            }
            else if (e.keyCode == 88) { //stop
                enemy.dx = 0;
                enemy.dy = 0;
            }
        });
    }

    if (e.keyCode > 36 && e.keyCode < 41 || e.keyCode == 32) {
        socket.emit("move", { direction: e.keyCode });
        console.log("Send Key Code: " + e.keyCode);
    };

    if (me.wait < 0) {
        me.x += me.dx;
        me.y += me.dy;
    }
    me.wait -= 10;
    if (enemy.wait < 0) {
        enemy.x += enemy.dx;
        enemy.y += enemy.dy;
    }
    enemy.wait -= 10;
}

//Render Loop
var render = function () {
    for(var i = 0; i < pellets.length; i++) {
        pellets[i].draw(ctx);
    }
    me.draw(ctx);
    enemy.draw(ctx);
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].draw(ctx);
    }
}

//Clears Screen to prepare for next draw
var clean = function () {
    ctx.fillStyle = "#0000C8";
    ctx.fillRect(0, 0, width, height);
}

//Main Game Loop
var main = function () {
	if (me !== undefined) {
		clean();

		update();
		render();
		ctx.fillStyle = "rgb(0, 0, 0)";

		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "right";
		ctx.fillText(fps.getFPS() + " FPS", canvas.width, 5);

		ctx.font = "24px Helvetica";
		ctx.textAlign = "center";
		ctx.fillText(check, canvas.width / 2, canvas.height / 2);
	}
}

//Set game loop and framerate
setInterval(main, 1000 / 60);