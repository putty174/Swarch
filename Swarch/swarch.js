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
    me = new pellet(width / 3, height / 3, 10, 10, "#00FF00", 2, 0, 0, 0, 0);
    enemy = new pellet(width * 2 / 3, height * 2 / 3, 10, 10, "#FF0000", 2, 0, 0, 0, 0);

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
function pellet(x, y, w, h, fill, s, sc, mx, my, w) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 10;
    this.h = h || 10;
    this.fill = fill || "#AAAAAA";
    this.speed = s || 2;
    this.score = sc || 0;
    this.dx = mx || 0;
    this.dy = my || 0;
    this.wait = w || 0;
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
    		&& me.score > enemy.score) {
        eatPlayer("me");
    }
    if (enemy.x <= (me.x + me.w) && me.x <= (enemy.x + enemy.w) && enemy.y <= (me.y + me.h) && me.y <= (enemy.y + enemy.h)
    		&& enemy.score > me.score) {
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
    me.x = Math.min(width * Math.random(), width - 10);
    me.y = Math.min(height * Math.random(), height - 10);
    me.w = 10;
    me.h = 10;
    me.score = 0;
    me.speed = 2;
}

var dieEnemy = function () {
    enemy.x = Math.min(width * Math.random(), width - 10);
    enemy.y = Math.min(width * Math.random(), width - 10);
    enemy.w = 10;
    enemy.h = 10;
    enemy.score = 0;
    enemy.speed = 2;
};

//Eat a pellet, grow, slow down, and put a new one somewhere
var eat = function (i) {
    me.score++;
    pellets.splice(i, 1);
	me.x -= 1;
	me.y -= 1;
    me.w += 2;
    me.h += 2;
    me.speed *= 0.9;
    me.wait = (me.w - 10) / 2;
    addPellet(new pellet(Math.min(width * Math.random(), width - 10), Math.min(height * Math.random(), height - 10), 10, 10, "#AAAAAA"));
}

var enemyEat = function (i) {
    enemy.score++;
    pellets.splice(i, 1);
    enemy.x -= 1;
    enemy.y -= 1;
    enemy.w += 2;
    enemy.h += 2;
    enemy.speed *= 0.9;
    enemy.wait = (enemy.w - 10) / 2;
    addPellet(new pellet(Math.min(width * Math.random(), width - 10), Math.min(height * Math.random(), height - 10), 10, 10, "#AAAAAA"));
};

//Player eats another Player
var eatPlayer = function (player) {
    if (player == "me") {
        me.score += enemy.score + 1;
        me.x -= enemy.score + 1;
        me.y -= enemy.score + 1;
        me.w += (enemy.score + 1) * 2;
        me.h += (enemy.score + 1) * 2;
        me.speed *= Math.pow(0.9, enemy.score + 1);
        me.wait = (me.w - 10) / 2;
        dieEnemy();
    }
    else if (player == "enemy") {
        enemy.score += me.score + 1;
        enemy.x -= me.score + 1;
        enemy.y -= me.score + 1;
        enemy.w += (me.score + 1) * 2;
        enemy.h += (me.score + 1) * 2;
        enemy.speed *= Math.pow(0.9, me.score + 1);
        enemy.wait = (enemy.w - 10) / 2;
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
		ctx.font = "10px Helvetica";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(me.score, me.x, me.y);
        ctx.fillText(enemy.score, enemy.x, enemy.y);

		//setTimeout(main, 1000 / 60 );
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "right";
		ctx.fillText(fps.getFPS() + " FPS", canvas.width, 0);

		//ctx.font = "24px Helvetica";
		//ctx.fillStyle = "#FFFFFF";
		//ctx.textAlign = "left";
		//ctx.fillText(me.speed , 20, 20);
	}
}

//Set game loop and framerate
setInterval(main, 1000 / 60);