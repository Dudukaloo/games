const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const wavesEl = document.getElementById("wave");
 
const KEYS = {};
 
let player, bullets, enemies, score, lives, waves, last, gameOver, pause, spawnTimer;
 
window.addEventListener("keydown", (e) => {
    KEYS[e.key.toLowerCase()] = true;
window.addEventListener("keyup", (e) => {
    KEYS[e.key.toLowerCase()] = false;
});
 
    if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
 
    if (e.key.toLowerCase() === "p") pause = !pause;
 
    if (e.key.toLowerCase() === "r" && gameOver) startGame();
});
 
// Axis-Aligned Bounding Box
function aabb(a, b) {
    return a.x < b.x + b.w
        && a.x + a.w > b.x
        && a.y < b.y + b.h
        && a.y + a.h > b.y;
};
 
class Player {
    constructor() {
        this.w = 36;
        this.h = 28;
        this.x = canvas.width / 2 - 18;
        this.y = canvas.height - 56;
        this.speed = 280;
        this.cooldown = 0;
    }
 
    update(dt) {
        const left = KEYS["arrowleft"] || KEYS["a"];
        const right = KEYS["arrowright"] || KEYS["d"];
 
        if (left) this.x -= this.speed * dt;
        if (right) this.x += this.speed * dt;
 
        this.x = Math.max(8, Math.min(canvas.width - this.w - 8, this.x));
        this.cooldown = Math.max(0, this.cooldown - dt);
 
        if ((KEYS[" "] || KEYS["arrowup"] || KEYS["w"]) && this.cooldown === 0) {
            bullets.push(new Bullet(this.x + this.w / 2 - 3, this.y - 8));
            this.cooldown = 0.22;
        }
    }
 
    draw() {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(this.x + this.w / 2, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.closePath();
        ctx.fill();
    }
}
 
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.h = 14;
        this.w = 6;
        this.speed = 420;
        this.dead = false;
    }
 
    update(dt) {
        this.y -= this.speed * dt;
 
        if (this.y + this.h < 0) this.dead = true;
    }
 
    draw() {
        ctx.fillStyle = "#fde047";
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}
 
class Enemy {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.dead = false;
        this.h = 28;
        this.w = 28;
    }
 
    update(dt) {
        this.y += this.speed * dt;
        if (this.y > canvas.height) this.dead = true;
    }
 
    draw() {
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}
 
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
 
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = "#c4b4b4";
        ctx.fillRect((i * 97) % canvas.width,
            (i * 53) % canvas.height, 2, 2);
    }
 
    player.draw();
    enemies.forEach((e) => e.draw());
    bullets.forEach((b) => b.draw());
 
    if (pause) {
        drawOverlay("PAUSA", "Pressione P para continuar");
    }
 
    if (gameOver) {
        drawOverlay("GAME OVER", "Pressione R para reiniciar");
    }
}
 
function startGame() {
    player = new Player();
    bullets = [];
    enemies = [];
    score = 0;
    lives = 3;
    waves = 1;
    spawnTimer = 0;
    pause = false;
    gameOver = false;
    last = 0;
    syncHud();
}
 
function update(dt) {
    if (pause || gameOver) return;
 
    player.update(dt);
 
    bullets.forEach((b) => b.update(dt));
    enemies.forEach((e) => e.update(dt));
 
    spawnWave(dt);
 
    bullets.forEach((b) => {
        enemies.forEach((e) => {
            if (!b.dead && !e.dead && aabb(b, e)) {
                b.dead = true;
                e.dead = true;
                score += 15;
            }
        });
    });
 
    enemies.forEach((e) => {
        if (!e.dead && aabb(e, player)) {
            e.dead = true;
            lives--;
 
            if (lives <= 0) gameOver = true;
        }
    });
 
    bullets = bullets.filter((b) => !b.dead);
    enemies = enemies.filter((e) => !e.dead);
 
    if (score >= waves * 100) {
        waves++;
    }
 
    syncHud();
}
 
function syncHud() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    wavesEl.textContent = waves;
}
 
function spawnWave(dt) {
    spawnTimer -= dt;
    if(spawnTimer <= 0){
        const count = 2 + waves;
 
        for(let i = 0; i < count; i++){
            const x = 20 + Math.random() * (canvas.width - 60);
            const speed = 40 + waves * 12 + Math.random() * 30;
            enemies.push(new Enemy(x, -30 - i * 28, speed ));
        }
        spawnTimer = Math.max(0.9, 2.2 - waves * 0.12)
    }
}

//Limpar tela do jogo
// Se estiver pausado ou "GameOver", desenha "Overlay"
function drawOverlay(text, sub) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.7)"
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.font = "bold 32px Segoe UI";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// Loop principal do jogo. Calcular o DeltaTime, atualizar e desenhar o cenário
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