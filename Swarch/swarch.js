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

var enemyWait = -1;
var enemySpeed = 1;
var dxE = 0;
var dyE = 0;
var enemyScore = 0;

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
    enemy = new pellet(width / 2 + 50, height / 2 + 50, 10, 10, "#FFFFFF");
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
function pellet(x, y, w, h, fill, s, sc, movex, movey) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 10;
    this.h = h || 10;
    this.fill = fill || "#AAAAAA";
    this.speed = s || 1;
    this.score = sc || 0;
    this.dx = movex || 0;
    this.dy = movey || 0;
}

//Pellet helper function to draw pellet
pellet.prototype.draw = function (ctx) {
    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);
}

//Check collision with walls or pellets
var checkCollide = function () {

    //Wall collision
    if (me.x < 0 || (me.x + me.w) > width || me.y < 0 || (me.y + me.h) > height) {
        die();
    }
    if (enemy.x < 0 || (enemy.x + me.w) > width || enemy.y < 0 || (enemy.y + enemy.h) > height) {
        dieEnemy();
    }

    //Check collision between players
    if (me.x <= (enemy.x + enemy.w) && enemy.x <= (me.x + me.w) && me.y <= (enemy.y + enemy.h) && enemy.y <= (me.y + me.h)
    		&& score > enemyScore) {
        eatPlayer("me");
    }
    if (enemy.x <= (me.x + me.w) && me.x <= (enemy.x + enemy.w) && enemy.y <= (me.y + me.h) && me.y <= (enemy.y + enemy.h)
    		&& enemyScore > score) {
        eatPlayer("enemy");
    }

    //Collision with pellets
    for (var i = 0; i < pellets.length; i++) {
        if (me.x <= (pellets[i].x + pellets[i].w) && pellets[i].x <= (me.x + me.w) && me.y <= (pellets[i].y + pellets[i].h) && pellets[i].y <= (me.y + me.h)) {
            eat(i);
        }

        if (enemy.x <= (pellets[i].x + pellets[i].w) && pellets[i].x <= (enemy.x + enemy.w) && enemy.y <= (pellets[i].y + pellets[i].h) && pellets[i].y <= (enemy.y + enemy.h)) {
            enemyEat(i);
        }
    }
}

//Die and respawn to center
var die = function () {
    me.x = width / 2;
    me.y = height / 2;
    me.w = 10;
    me.h = 10;
    score = 1;
    speed = 1;
	dx = 0;
	dy = 0;
}

var dieEnemy = function () {
    enemy.x = width / 2 + 50;
    enemy.y = height / 2 + 50;
    enemy.w = 10;
    enemy.h = 10;
    enemyScore = 1;
    enemySpeed = 1;
};

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

var enemyEat = function (i) {
    enemyScore++;
    pellets.splice(i, 1);
    enemy.w += 2;
    enemy.h += 2;
    enemySpeed *= 0.95;
    enemyWait = (enemy.w - 10) / 2;
    addPellet(new pellet(Math.min(width * Math.random(), width - 10), Math.min(height * Math.random(), height - 10), 10, 10, "#AAAAAA"));
};

//Player eats another Player
var eatPlayer = function (player) {
    if (player == "me") {
        score = score + enemyScore;
        me.w += enemyScore * 2;
        me.h += enemyScore * 2;
        speed *= 0.95;
        wait = (me.w - 10) / 2;
        dieEnemy();
    }
    else if (player == "enemy") {
        enemyScore = enemyScore + score;
        enemy.w += score * 2;
        enemy.h += score * 2;
        enemySpeed *= 0.95;
        enemyWait = (enemy.w - 10) / 2;
        die();
    }
};

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

	$(document).keydown(function(e){
	    if (e.keyCode == 37) {  //left
	        dx = -speed;
	        dy = 0;
	    }
	    else if (e.keyCode == 39) { //right
	        dx = speed;
	        dy = 0;
	    }
	    else if (e.keyCode == 38) { //up
	        dx = 0;
	        dy = -speed;
	    }
	    else if (e.keyCode == 40) { //down
	        dx = 0;
	        dy = speed;
	    }
	    else if (e.keyCode == 65) { //left
	        dxE = -speed;
	        dyE = 0;
	    }
	    else if (e.keyCode == 68) { //right
	        dxE = speed;
	        dyE = 0;
	    }
	    else if (e.keyCode == 87) { //up
	        dxE = 0;
	        dyE = -speed;
	    }
	    else if (e.keyCode == 83) { //down
	        dxE = 0;
	        dyE = speed;
	    }
	    
	});
    
    if (wait < 0) {
        me.x += dx;
        me.y += dy;
    }
    wait -= 10;
    if (enemyWait < 0) {
        enemy.x += dxE;
        enemy.y += dyE;
    }
    enemyWait -= 10;
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