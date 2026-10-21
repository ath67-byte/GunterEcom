const canvas = document.getElementById("game");
const rect = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const bestScore = document.getElementById("best-score");
const startButton = document.getElementById("start");
const game_length = 30;
const diamond_count = 10;
const diamond_size = 20;
const miner = {x: 220, y: 140, size: 34, speed: 3, facing: 1};

let diamonds = []
let score = 0;
let best = loadBest();
let timeLeft = game_length;
let startTime = 0;
let running = false;
let finished = false;

const keyPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
}
window.addEventListener("keydown", (event) => {
    if (event.key in keysPressed){
        keyPressed[event.key] = false;
    }
});
function movement(){
  if (keysPressed.ArrowUp) y -= speed;
  if (keysPressed.ArrowDown) y += speed;
  if (keysPressed.ArrowLeft) x -= speed;
  if (keysPressed.ArrowRight) x += speed;

  miner.style.top = `${y}px`
  miner.style.left = `${x}px`
  requestAnimationFrame(movement);
}
movement;