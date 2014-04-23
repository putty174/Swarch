var width = 600;    //Width of game screen
var height = 400;   //Height of game screen

var keys = []; // List of currently pressed keys

var me; //Player
var enemies = [];   //List of enemies
var pellets = [];   //List of pellets on screen

var wait = -1; // How long to wait before moving again
var speed = 2;
var dx = 0; //Horizontal speed
var dy = 0; //Vertical speed
var score = 0;  //Player score

//Set up area to draw game on. PLEASE DO NOT TOUCH!!!
var canvas = document.createElement("canvas");  
canvas.width = width;
canvas.height = height;
var ctx = canvas.getContext("2d");

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
	
	document.write("Name: " + name + "<br>");
	document.write("Pass: " + pass + "<br>");
	var logOut = document.createElement("BUTTON");
	var logOutText = document.createTextNode("Log Out");
	logOut.appendChild(logOutText);
	logOut.onclick = function () { document.location.reload(); };

	document.body.appendChild(logOut);
	document.write("<br>");
	document.body.appendChild(canvas);
	
	setup();
}

//Setup game by placing objects
var setup = function () {
    me = new pellet(width / 2, height / 2, 10, 10, "#00FF00");
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
function pellet(x, y, w, h, fill) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 10;
    this.h = h || 10;
    this.fill = fill || "#AAAAAA";
}

//Pellet helper function to draw pellet
pellet.prototype.draw = function (ctx) {
    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);
}

//Check collision with walls or pellets
var checkCollide = function () {
    if (me.x < 0 || (me.x + me.w) > width || me.y < 0 || (me.y + me.h) > height) {
        die();
    }
    for (var i = 0; i < pellets.length; i++) {
        if (me.x <= (pellets[i].x + pellets[i].w) && pellets[i].x <= (me.x + me.w) && me.y <= (pellets[i].y + pellets[i].h) && pellets[i].y <= (me.y + me.h)) {
            eat(i);
        }
    }
}

//Die and respawn to center
var die = function () {
    me.x = width / 2;
    me.y = height / 2;
    me.w = 10;
    me.h = 10;
    score = 0;
    speed = 1;
}

//Eat a pellet, grow, slow down, and put a new one somewhere
var eat = function (i) {
    score++;
    pellets.splice(i, 1);
	me.x -= 1;
	me.y -= 1;
    me.w += 1;
    me.h += 1;
    speed *= 0.95;
    wait = (me.w - 10) / 2;
    addPellet(new pellet(Math.min(width * Math.random(), width - 10), Math.min(height * Math.random(), height - 10), 10, 10, "#AAAAAA"));
}

//Reads input from keyboard and moves player accordingly
var update = function () {
    checkCollide();
	addEventListener("keydown", function (e) {
		keys[e.keyCode] = true;
	}, false);
	addEventListener("keyup", function (e) {
		keys[e.keyCode] = false;
	}, false);
	
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
	
    if (wait < 0) {
        me.x += dx;
        me.y += dy;
    }
    wait -= 10;
}

//Render Loop
var render = function () {
    for(var i = 0; i < pellets.length; i++) {
        pellets[i].draw(ctx);
    }
    me.draw(ctx);
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
		ctx.font = "10px Helvetica";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(score, me.x, me.y);

		//setTimeout(main, 1000 / 60 );
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "right";
		ctx.fillText(fps.getFPS() + " FPS", canvas.width, 0);
	}
}

//Set game loop and framerate
setInterval(main, 1000 / 60);