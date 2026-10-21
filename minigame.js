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