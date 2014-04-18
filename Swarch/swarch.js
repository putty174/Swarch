var width = 600;
var height = 400;
var key;

addEventListener("keydown", function (e) {
    key = e.keyCode;
}, false);

function start() {
	var name = document.getElementById('name').value;
	var pass = document.getElementById('pass').value;
	
	document.write("Name: " + name + "<br>");
	document.write("Pass: " + pass + "<br>");

	var canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
	var ctx = canvas.getContext("2d");

	ctx.fillStyle = "#0000C8";
	ctx.fillRect(0, 0, width, height);

	var game = new gameState(canvas);

	game.addPellet(new pellet(width * 0.25, height * 0.25, 10, 10, "#AAAAAA"));
	game.addPellet(new pellet(width * 0.25, height * 0.75, 10, 10, "#AAAAAA"));
	game.addPellet(new pellet(width * 0.75, height * 0.25, 10, 10, "#AAAAAA"));
	game.addPellet(new pellet(width * 0.75, height * 0.75, 10, 10, "#AAAAAA"));
}

function pellet(x, y, w, h, fill) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 10;
    this.h = h || 10;
    this.fill = fill || "#AAAAAA";
}

pellet.prototype.draw = function (ctx) {
    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);
}

function gameState(canvas) {
    var me = new pellet(width/2, height/2,10,10,"#00FF00");
    var enemies = [];
    var pellets = [];
}


var update = function (mod) {
    if (key == 32) {
    }
    else if (key == 37) {
        me.x -= (width - me.width) * 0.1 * mod;
    }
    else if (key == 38) {
        me.y -= (height - me.height) * 0.1 * mod;
    }
    else if (key == 39) {
        me.x += (width - me.width) * 0.1 * mod;
    }
    else if (key == 40) {
        me.y += (height - me.height) * 0.1 * mod;
    }
}

//var gameLoop = function () {
//    update();
//    gLoop = setTimeout(gameLoop, 1000 / 50);
//};

//update = function () {
//    document.addEventListener('keydown', function (event) {
//        key = event.keyCode;
//    }, true);

//    document.write(key);
//};