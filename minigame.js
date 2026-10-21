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
const red_chance = 0.05;
const warning_time = 1000;
const gem_types = {
    blue: { points: 1, life: 5000, src: "Minigame/blue-diamond.png" },
    green: { points: 3, life: 3000, src: "Minigame/green-diamond.png" },
    red: { points: 5, life: 2000, src: "Minigame/red-diamond.png" }
};
const bat = { x: 0, y: 0, size: 30, speed: 2, dx: 0, dy: 0, el: null };
const bat_penalty = 2;
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
                score += gem_types[diamonds[i].kind].points;
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

        moveBat();

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
            kind: pickKind()
        };
    } while (border(miner, d));

    d.born = Date.now();
    d.life = gem_types[d.kind].life;

    d.el = document.createElement("img");
    d.el.src = gem_types[d.kind].src;
    d.el.className = "diamond";
    d.el.style.left = d.x + "px";
    d.el.style.top = d.y + "px";
    mine.appendChild(d.el);
    return d;
}

function pickKind() {
    const roll = Math.random();
    if (roll < red_chance) return "red";
    if (roll < red_chance + green_chance) return "green";
    return "blue";
}

function placeBat() {
    do {
        bat.x = wall + Math.random() * (mine_width - 2 * wall - bat.size);
        bat.y = wall + Math.random() * (mine_height - 2 * wall - bat.size);
    } while (Math.hypot(bat.x - miner.x, bat.y - miner.y) < mine_width / 3);

    const angle = Math.random() * Math.PI * 2;
    bat.dx = Math.cos(angle) * bat.speed;
    bat.dy = Math.sin(angle) * bat.speed;
    drawBat();
}

function moveBat() {
    bat.x += bat.dx;
    bat.y += bat.dy;

    if (bat.x < wall || bat.x > mine_width - wall - bat.size) {
        bat.dx = -bat.dx;
        bat.x = Math.max(wall, Math.min(bat.x, mine_width - wall - bat.size));
    }
    if (bat.y < wall || bat.y > mine_height - wall - bat.size) {
        bat.dy = -bat.dy;
        bat.y = Math.max(wall, Math.min(bat.y, mine_height - wall - bat.size));
    }

    if (border(miner, bat)) {
        score = Math.max(0, score - bat_penalty);
        scoreText.textContent = score;
        minerImg.classList.add("hurt");
        setTimeout(() => minerImg.classList.remove("hurt"), 300);
        placeBat();
    }

    drawBat();
}

function drawBat() {
    bat.el.style.left = bat.x + "px";
    bat.el.style.top = bat.y + "px";
    bat.el.style.transform = bat.dx < 0 ? "scaleX(-1)" : "scaleX(1)";
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

    if (!bat.el) {
        bat.el = document.createElement("img");
        bat.el.src = "Minigame/bat.png";
        bat.el.className = "bat";
        mine.appendChild(bat.el);
    }
    bat.el.classList.remove("hidden");
    placeBat();

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
    bat.el.classList.add("hidden");
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
