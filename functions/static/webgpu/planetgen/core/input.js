var mouseDown = false;
var middleMouseDown = false;
var mouseOnScreen = true;

var shiftDown = false;

var mouseXPos = 0;
var mouseYPos = 0;

var prevMouseXPos = 0;
var prevMouseYPos = 0;

var mouseXDelta = 0;
var mouseYDelta = 0;

var scrollDelta = 0;

export function keyPressHandler(e) {
    shiftDown = e.shiftKey;
}
export function mousePressHandler(e) {
    mouseDown = true;
    if(e.button == 1) {
        middleMouseDown = true;
    }
}
export function mouseReleaseHandler(e) {
    mouseDown = false;
    if(e.button == 1) {
        middleMouseDown = false;
    }
}
export function mouseOverHandler(e) {
    mouseOnScreen = true;
}
export function mouseOutHandler(e) {
    mouseOnScreen = false;
    mouseDown = false;
}
export function mouseMoveHandler(e) {
    mouseXPos = e.clientX;
    mouseYPos = e.clientY;
}
export function mouseScrollHandler(e) {
    scrollDelta = e.deltaY;
}
export function mouseScrollEndHandler(e) {
    scrollDelta = e.deltaY;
}

export function updateInput() {
    mouseXDelta = prevMouseXPos - mouseXPos;
    mouseYDelta = prevMouseYPos - mouseYPos;

    prevMouseXPos = mouseXPos;
    prevMouseYPos = mouseYPos;
}

export function getInput() {
    var InputData = {
        shiftDown: shiftDown,

        mouseDown: (mouseDown && mouseOnScreen),
        middleMouseDown: (middleMouseDown && mouseOnScreen),

        mouseXPos: mouseXPos,
        mouseYPos: mouseYPos,

        mouseXDiff: mouseXDelta,
        mouseYDiff: mouseYDelta,

        scrollDelta: scrollDelta
    }
    scrollDelta = 0;

    return InputData;
}