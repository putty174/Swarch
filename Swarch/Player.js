var Player = function () {
    var id;
    var x;
    var y;
    var w;
    var h;
    var fill;
    var speed;
    var score;
    var direction;
    var wait;

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

    var getFill = function () {
        return fill;
    }

    var setFill = function (newFill) {
        fill = newFill;
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
    };

    var getWait = function () {
        return wait;
    }

    var setWait = function (newWait) {
        wait = newWait;
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
        getFill: getFill,
        setFill: setFill,
        getSpeed: getSpeed,
        setSpeed: setSpeed,
        getScore: getScore,
        setScore: setScore,
        getDirection: getDirection,
        setDirection: setDirection,
        getWait: getWait,
        setWait: setWait,
        id: id
    }
};
exports.Player = Player;