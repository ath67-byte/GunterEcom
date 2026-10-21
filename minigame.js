const mine = document.getElementById("mine");
const minerImg = document.getElementById("minerImg");
const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const bestScore = document.getElementById("best");
const startButton = document.getElementById("startButton");

const game_length = 30;
const diamond_count = 5;
const diamond_size = 22;
const green_chance = 0.15;
const green_points = 3;
const diamond_life = 5000;
const green_life = 3000;
const warning_time = 1000;
const wall_fraction = 10 / 160;
const miner = { x: 0, y: 0, size: 34, speed: 3 };

let mine_width = mine.clientWidth;
let mine_height = mine.clientHeight;
let wall = mine_width * wall_fraction;
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
        if (keyPressed.ArrowLeft) {
            miner.x -= miner.speed;
            minerImg.style.transform = "scaleX(-1)";
        }
        if (keyPressed.ArrowRight) {
            miner.x += miner.speed;
            minerImg.style.transform = "scaleX(1)";
        }

        miner.x = Math.max(wall, Math.min(miner.x, mine_width - wall - miner.size));
        miner.y = Math.max(wall, Math.min(miner.y, mine_height - wall - miner.size));

        drawMiner();

        for (let i = diamonds.length - 1; i >= 0; i--) {
            if (border(miner, diamonds[i])) {
                score += diamonds[i].green ? green_points : 1;
                diamonds[i].el.remove();
                diamonds.splice(i, 1);
                diamonds.push(makeDiamond());
                scoreText.textContent = score;
            } else {
                const age = Date.now() - diamonds[i].born;
                if (age > diamonds[i].life) {
                    diamonds[i].el.remove();
                    diamonds.splice(i, 1);
                    diamonds.push(makeDiamond());
                } else if (age > diamonds[i].life - warning_time) {
                    diamonds[i].el.classList.add("fading");
                }
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
            x: wall + Math.random() * (mine_width - 2 * wall - diamond_size),
            y: wall + Math.random() * (mine_height - 2 * wall - diamond_size),
            size: diamond_size,
            green: Math.random() < green_chance
        };
    } while (border(miner, d));

    d.born = Date.now();
    d.life = d.green ? green_life : diamond_life;

    d.el = document.createElement("img");
    d.el.src = d.green ? "Minigame/green-diamond.png" : "Minigame/blue-diamond.png";
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
    wall = mine_width * wall_fraction;

    score = 0;
    scoreText.textContent = 0;

    miner.x = (mine_width - miner.size) / 2;
    miner.y = (mine_height - miner.size) / 2;
    drawMiner();
    minerImg.style.transform = "scaleX(1)";
    minerImg.classList.remove("hidden");

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
    setTimeout(() => alert("Time's up! You found " + score + (score === 1 ? " diamond" : " diamonds")), 50);
}

movement();
