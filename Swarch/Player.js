var Player = function (startX, startY) {
    var id;
    var x = startx;
    var y = starty;
    var direction;

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

    var getDirection = function () {
        return direction;
    };

    var setDirection = function (newD) {
        direction = newD;
    };

    return {
        getX: getX,
        setX: setX,
        getY: getY,
        setY: setY,
        getDirection: getDirection,
        setDirection: setDirection,
        id: id
    }
};
exports.Player = Player;