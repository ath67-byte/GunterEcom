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
const wall_fraction = 10 / 160;
const base_width = 480;
const miner_base_size = 34;
const miner_base_speed = 3;
const miner = { x: 0, y: 0, size: miner_base_size, speed: miner_base_speed };

let mine_width = mine.clientWidth;
let mine_height = mine.clientHeight;
let wall = mine_width * wall_fraction;
let gem_size = diamond_size;
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
            x: wall + Math.random() * (mine_width - 2 * wall - gem_size),
            y: wall + Math.random() * (mine_height - 2 * wall - gem_size),
            size: gem_size,
            kind: pickKind()
        };
    } while (border(miner, d));

    d.born = Date.now();
    d.life = gem_types[d.kind].life;

    d.el = document.createElement("img");
    d.el.src = gem_types[d.kind].src;
    d.el.className = "diamond";
    drawDiamond(d);
    mine.appendChild(d.el);
    return d;
}

function pickKind() {
    const roll = Math.random();
    if (roll < red_chance) return "red";
    if (roll < red_chance + green_chance) return "green";
    return "blue";
}

function border(a, b) {
    return a.x < b.x + b.size && a.x + a.size > b.x &&
           a.y < b.y + b.size && a.y + a.size > b.y;
}

function updateSize() {
    const new_width = mine.clientWidth;
    const ratio = mine_width > 0 ? new_width / mine_width : 1;
    const scale = new_width / base_width;

    mine_width = new_width;
    mine_height = mine.clientHeight;
    wall = mine_width * wall_fraction;

    miner.size = miner_base_size * scale;
    miner.speed = miner_base_speed * scale;
    miner.x *= ratio;
    miner.y *= ratio;
    minerImg.style.width = miner.size + "px";
    minerImg.style.height = miner.size + "px";
    drawMiner();

    gem_size = diamond_size * scale;
    diamonds.forEach((d) => {
        d.x *= ratio;
        d.y *= ratio;
        d.size = gem_size;
        drawDiamond(d);
    });
}

function drawDiamond(d) {
    d.el.style.left = d.x + "px";
    d.el.style.top = d.y + "px";
    d.el.style.width = d.size + "px";
    d.el.style.height = d.size + "px";
}

window.addEventListener("resize", updateSize);

function startGame() {
    updateSize();

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

updateSize();
movement();
