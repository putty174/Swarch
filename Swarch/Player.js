var Player = function () {
    var id;
    var x = 0; 
	var y = 0;
    var w = 10;
	var h = 10;
	var dx = 0;
	var dy = 0;
    var speed = 2;
    var score = 0;
    var direction;
    var wait = 0;

    var getID = function () {
        return id;
    };

    var setID = function (newID) {
        id = newID;
    };

    var getX = function () {
        return x;
    };

    var setX = function (newX) {
        x = newX;
    };

    var getY = function () {
        return y;
    };

    var setY = function (newY) {
        y = newY;
    };

    var getW = function () {
        return w;
    }

    var setW = function (newW) {
        w = newW;
    }

    var getH = function () {
        return h;
    }

    var setH = function (newH) {
        h = newH;
    }

    var getSpeed = function () {
        return speed;
    }

    var setSpeed = function (newSpeed) {
        speed = newSpeed;
    }

    var getScore = function () {
        return score;
    }

    var setScore = function (newScore) {
        score = newScore;
    }

    var getDirection = function () {
        return direction;
    };

    var setDirection = function (newD) {
        direction = newD;
		
		if (direction == "left") {  //left
			dx = -speed;
			dy = 0;
		}
		else if (direction == "right") { //right
			dx = speed;
			dy = 0;
		}
		else if (direction == "up") { //up
			dx = 0;
			dy = -speed;
		}
		else if (direction == "down") { //down
			dx = 0;
			dy = speed;
		}
		else if (direction == "stop") { //stop
			dx = 0;
			dy = 0;
		}
    };

    var getWait = function () {
        return wait;
    }

    var setWait = function (newWait) {
        wait = newWait;
    }
	
	var update = function () {
		x += dx;
		y += dy;
	}

    return {
        getID: getID,
        setID: setID,
        getX: getX,
        setX: setX,
        getY: getY,
        setY: setY,
        getW: getW,
        setW: setW,
        getH: getH,
        setH: setH,
        getSpeed: getSpeed,
        setSpeed: setSpeed,
        getScore: getScore,
        setScore: setScore,
        getDirection: getDirection,
        setDirection: setDirection,
        getWait: getWait,
        setWait: setWait,
		update: update,
        id: id
    }
};
exports.Player = Player;