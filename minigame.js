const mine = document.getElementById("mine");
const minerImg = document.getElementById("minerImg");
const mineMessage = document.getElementById("mineMessage");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const bestScore = document.getElementById("best");
const startButton = document.getElementById("startButton");

const game_length = 30;
const diamond_count = 5;
const diamond_size = 22;
const miner = { x: 0, y: 0, size: 34, speed: 3 };

let mine_width = mine.clientWidth;
let mine_height = mine.clientHeight;
let diamonds = [];
let score = 0;
let best = Number(localStorage.getItem("minerBest")) || 0;
let timeLeft = game_length;
let startTime = 0;
let running = false;

bestScore.textContent = best;

const keyPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener("keydown", (event) => {
    if (event.key in keyPressed) {
        event.preventDefault();
        keyPressed[event.key] = true;
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key in keyPressed) {
        keyPressed[event.key] = false;
    }
});

document.querySelectorAll(".dpad-btn").forEach((btn) => {
    const key = btn.dataset.key;
    btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        keyPressed[key] = true;
    });
    btn.addEventListener("pointerup", () => keyPressed[key] = false);
    btn.addEventListener("pointerleave", () => keyPressed[key] = false);
    btn.addEventListener("pointercancel", () => keyPressed[key] = false);
});

function movement() {
    if (running) {
        if (keyPressed.ArrowUp) miner.y -= miner.speed;
        if (keyPressed.ArrowDown) miner.y += miner.speed;
        if (keyPressed.ArrowLeft) miner.x -= miner.speed;
        if (keyPressed.ArrowRight) miner.x += miner.speed;

        miner.x = Math.max(0, Math.min(miner.x, mine_width - miner.size));
        miner.y = Math.max(0, Math.min(miner.y, mine_height - miner.size));

        drawMiner();

        for (let i = diamonds.length - 1; i >= 0; i--) {
            if (border(miner, diamonds[i])) {
                diamonds[i].el.remove();
                diamonds.splice(i, 1);
                diamonds.push(makeDiamond());
                score++;
                scoreText.textContent = score;
            }
        }

        updateTimer();
    }
    requestAnimationFrame(movement);
}

function drawMiner() {
    minerImg.style.left = miner.x + "px";
    minerImg.style.top = miner.y + "px";
}

function makeDiamond() {
    let d;
    do {
        d = {
            x: Math.random() * (mine_width - diamond_size),
            y: Math.random() * (mine_height - diamond_size),
            size: diamond_size
        };
    } while (border(miner, d));

    d.el = document.createElement("div");
    d.el.className = "diamond";
    d.el.style.left = d.x + "px";
    d.el.style.top = d.y + "px";
    mine.appendChild(d.el);
    return d;
}

function border(a, b) {
    return a.x < b.x + b.size && a.x + a.size > b.x &&
           a.y < b.y + b.size && a.y + a.size > b.y;
}

function startGame() {
    mine_width = mine.clientWidth;
    mine_height = mine.clientHeight;

    score = 0;
    scoreText.textContent = 0;

    miner.x = (mine_width - miner.size) / 2;
    miner.y = (mine_height - miner.size) / 2;
    drawMiner();
    minerImg.classList.remove("hidden");
    mineMessage.classList.add("hidden");

    diamonds.forEach((d) => d.el.remove());
    diamonds = [];
    for (let i = 0; i < diamond_count; i++) diamonds.push(makeDiamond());

    startTime = Date.now();
    timeText.textContent = game_length;
    running = true;
    startButton.textContent = "Restart";
}

startButton.addEventListener("click", startGame);

function updateTimer() {
    timeLeft = game_length - (Date.now() - startTime) / 1000;
    if (timeLeft <= 0) {
        timeLeft = 0;
        endGame();
    }
    timeText.textContent = Math.ceil(timeLeft);
}

function endGame() {
    Object.keys(keyPressed).forEach((k) => keyPressed[k] = false);
    running = false;
    if (score > best) {
        best = score;
        localStorage.setItem("minerBest", best);
    }
    bestScore.textContent = best;
    startButton.textContent = "Play again";

    messageTitle.textContent = "Time's up!";
    messageText.textContent = "You found " + score + (score === 1 ? " diamond" : " diamonds");
    mineMessage.classList.remove("hidden");
}

movement();
