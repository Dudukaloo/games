
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const wavesEl = document.getElementById("wave");
const escapesEl = document.getElementById("escapes");
const specialEl = document.getElementById("special");

const keys = {};
let player, bullets, enemies, effects, score, lives, waves, escapes;
let spawnTimer, last = 0, paused = false, gameOver = false;

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) e.preventDefault();
    if (key === "p" && !e.repeat && !gameOver) paused = !paused;
    if (key === "r" && !e.repeat && gameOver) startGame();
    keys[key] = true;
});

window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

function hit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

class Player {
    constructor() {
        this.w = 40; this.h = 32;
        this.x = canvas.width / 2 - 20; this.y = canvas.height - 58;
        this.speed = 280; this.cooldown = 0; this.specialCooldown = 0;
    }

    update(dt) {
        if (keys.arrowleft || keys.a) this.x -= this.speed * dt;
        if (keys.arrowright || keys.d) this.x += this.speed * dt;

        this.x = Math.max(8, Math.min(canvas.width - this.w - 8, this.x));
        this.cooldown = Math.max(0, this.cooldown - dt);
        this.specialCooldown = Math.max(0, this.specialCooldown - dt);

        if ((keys[" "] || keys.arrowup || keys.w) && this.cooldown === 0) {
            bullets.push(new Bullet(this.x + 17, this.y - 10));
            this.cooldown = 0.22;
        }

        if (keys.x && this.specialCooldown === 0) {
            bullets.push(new Bullet(this.x + 13, this.y - 16, true));
            this.specialCooldown = 2;
        }
    }

    draw() {
        ctx.fillStyle = "#fb923c";
        ctx.beginPath(); ctx.moveTo(this.x + 15, this.y + 24);
        ctx.lineTo(this.x + 20, this.y + 34); ctx.lineTo(this.x + 25, this.y + 24); ctx.fill();

        ctx.fillStyle = "#0891b2";
        ctx.beginPath(); ctx.moveTo(this.x + 15, this.y + 12);
        ctx.lineTo(this.x + 1, this.y + 25);
        ctx.lineTo(this.x + 10, this.y + 27);
        ctx.lineTo(this.x + 17, this.y + 22); ctx.fill();

        ctx.beginPath(); ctx.moveTo(this.x + 25, this.y + 12);
        ctx.lineTo(this.x + 39, this.y + 25);
        ctx.lineTo(this.x + 30, this.y + 27);
        ctx.lineTo(this.x + 23, this.y + 22); ctx.fill();

        ctx.fillStyle = "#38bdf8";
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 1);
        ctx.quadraticCurveTo(this.x + 27, this.y + 4, this.x + 27, this.y + 12);
        ctx.lineTo(this.x + 25, this.y + 26);
        ctx.quadraticCurveTo(this.x + 20, this.y + 31, this.x + 15, this.y + 26);
        ctx.lineTo(this.x + 13, this.y + 12);
        ctx.quadraticCurveTo(this.x + 13, this.y + 4, this.x + 20, this.y + 1);
        ctx.fill();

        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 12, 3.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Bullet {
    constructor(x, y, special = false) {
        this.x = x; this.y = y; this.special = special; this.dead = false;
        this.w = special ? 14 : 6; this.h = special ? 24 : 14;
        this.speed = special ? 520 : 420;
    }

    update(dt) {
        this.y -= this.speed * dt;
        if (this.y + this.h < 0) this.dead = true;
    }

    draw() {
        ctx.fillStyle = this.special ? "#c084fc" : "#fde047";
        if (this.special) {
            ctx.shadowColor = "#c084fc";
            ctx.shadowBlur = 12;
        }
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor(x, y, speed) {
        this.x = x; this.y = y; this.speed = speed;
        this.w = 28; this.h = 28; this.dead = false; this.escaped = false;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y > canvas.height) {
            this.dead = true;
            this.escaped = true;
        }
    }

    draw() {
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

function startGame() {
    player = new Player();
    bullets = [];
    enemies = [];
    effects = [];

    score = 0;
    lives = 5;
    waves = 1;
    escapes = 0;

    spawnTimer = 0;
    paused = false;
    gameOver = false;
    last = 0;

    Object.keys(keys).forEach(k => keys[k] = false);
    updateHud();
}

function spawnWave(dt) {
    spawnTimer -= dt;
    if (spawnTimer > 0) return;

    // Tune: quantidade vai de 2 a 4 (a cada 3 ondas);
    // velocidade começa entre 48 e 64 px/s e sobe 3 px/s por onda,
    // com limite de +30 px/s; intervalo começa em 2,8 s e cai
    // 0,07 s por onda, até o mínimo de 1,65 s.

    const count = Math.min(2 + Math.floor((waves - 1) / 3), 4);

    for (let i = 0; i < count; i++) {
        const x = 20 + Math.random() * (canvas.width - 60);
        const speed = 48 + Math.min(waves - 1, 10) * 3 + Math.random() * 16;
        enemies.push(new Enemy(x, -30 - i * 28, speed));
    }

    spawnTimer = Math.max(1.65, 2.8 - (waves - 1) * 0.07);
}

function update(dt) {
    if (paused || gameOver) return;

    player.update(dt);
    bullets.forEach(b => b.update(dt));
    enemies.forEach(e => e.update(dt));

    effects.forEach(v => v.t -= dt);
    effects = effects.filter(v => v.t > 0);

    // Cada fuga tira uma vida; cada colisão com a nave também.
    // Com 5 vidas, cinco fugas ou cinco colisões encerram a partida.

    enemies.forEach(e => {
        if (e.escaped) {
            e.escaped = false;
            escapes++;
            lives--;
        }
    });

    if (lives > 0) {
        spawnWave(dt);

        bullets.forEach(b => enemies.forEach(e => {
            if (!b.dead && !e.dead && hit(b, e)) {
                if (!b.special) b.dead = true;
                e.dead = true;
                score += 15;
                effects.push({ x: e.x + 14, y: e.y + 14, t: 0.16 });
            }
        }));

        enemies.forEach(e => {
            if (!e.dead && hit(e, player)) {
                e.dead = true;
                lives--;
            }
        });
    }

    bullets = bullets.filter(b => !b.dead);
    enemies = enemies.filter(e => !e.dead);

    if (lives <= 0) gameOver = true;

    while (score >= waves * 100) waves++;

    updateHud();
}

function updateHud() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    wavesEl.textContent = waves;

    if (escapesEl) escapesEl.textContent = `${escapes}/5`;

    if (specialEl) {
        specialEl.textContent = player.specialCooldown <= 0
            ? "PRONTO"
            : `${player.specialCooldown.toFixed(1)}s`;
    }
}

function drawOverlay(title, subtitle) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.76)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.font = "bold 32px Segoe UI";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 8);

    ctx.font = "15px Segoe UI";
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 24);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = "#c4b4b4";
        ctx.fillRect((i * 97) % canvas.width, (i * 53) % canvas.height, 2, 2);
    }

    effects.forEach(v => {
        ctx.globalAlpha = v.t / 0.16;
        ctx.strokeStyle = "#67e8f9";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(v.x, v.y, 4 + 14 * (1 - v.t / 0.16), 0, Math.PI * 2);
        ctx.stroke();
    });

    ctx.globalAlpha = 1;

    player.draw();
    enemies.forEach(e => e.draw());
    bullets.forEach(b => b.draw());

    if (paused) drawOverlay("PAUSA", "Pressione P para continuar");
    if (gameOver) drawOverlay("GAME OVER", "Pressione R para reiniciar");
}

function loop(ts) {
    if (!last) last = ts;

    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

startGame();
requestAnimationFrame(loop);
