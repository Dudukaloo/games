
"use strict";

// Tamanho lógico do jogo
const LARGURA = 480;
const ALTURA = 520;

const canvas = document.getElementById("blocos");
const ctx = canvas.getContext("2d");

// Aumenta a resolução interna para reduzir o serrilhado
function ajustarResolucaoCanvas() {
    const rect = canvas.getBoundingClientRect();
    const escalaCSS = rect.width > 0 ? rect.width / LARGURA : 1;

    const escala = Math.max(
        1,
        Math.min(3, escalaCSS * (window.devicePixelRatio || 1))
    );

    canvas.width = Math.round(LARGURA * escala);
    canvas.height = Math.round(ALTURA * escala);

    ctx.setTransform(
        canvas.width / LARGURA,
        0,
        0,
        canvas.height / ALTURA,
        0,
        0
    );

    ctx.imageSmoothingEnabled = true;
}

ajustarResolucaoCanvas();
window.addEventListener("resize", ajustarResolucaoCanvas);

// Raquete
const paddle = {
    w: 94,
    h: 10,
    x: (LARGURA - 94) / 2,
    y: ALTURA - 30,
    speed: 420
};

// Bola
const ball = {
    r: 6.5,
    x: LARGURA / 2,
    y: ALTURA - 46,
    vx: 0,
    vy: 0,
    launched: false
};

const teclas = Object.create(null);

let bricks = [];
let score = 0;
let lives = 3;
let gameOver = false;
let victory = false;
let paused = false;

// Paleta inspirada na bandeira bissexual:
// rosa, roxo e azul
const brickColors = [
    "#F12683",
    "#D43B9D",
    "#9953B5",
    "#3979E8"
];

// Cria os blocos
function construirBlocos() {
    bricks = [];

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 7; col++) {

            const hole =
                (row === 1 && col === 0) ||
                (row === 2 && col === 5);

            let decoration = "";

            if (
                (row === 0 && col === 3) ||
                (row === 1 && col === 6)
            ) {
                decoration = "ring";
            } else if (row === 2 && col === 4) {
                decoration = "lines";
            } else if (
                row === 3 &&
                (col === 1 || col === 5)
            ) {
                decoration = "cross";
            }

            bricks.push({
                x: 18 + col * 64,
                y: 58 + row * 28,
                w: 60,
                h: 23,
                color: brickColors[row],
                alive: !hole,
                hole,
                decoration
            });
        }
    }
}

// Limita a raquete à área do jogo
function limitarRaquete() {
    paddle.x = Math.max(
        8,
        Math.min(LARGURA - paddle.w - 8, paddle.x)
    );
}

// Coloca a bola sobre a raquete
function reposicionarBola() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 4;

    ball.vx = 0;
    ball.vy = 0;
    ball.launched = false;
}

// Reinicia a partida
function reset() {
    score = 0;
    lives = 3;

    gameOver = false;
    victory = false;
    paused = false;

    paddle.x = (LARGURA - paddle.w) / 2;

    construirBlocos();
    reposicionarBola();
}

// Lança a bola
function lancarBola() {
    if (gameOver || victory) {
        reset();
        return;
    }

    if (paused || ball.launched) return;

    ball.launched = true;

    const speed = 290;
    const angle = (Math.random() - 0.5) * 0.6;

    ball.vx = Math.sin(angle) * speed;
    ball.vy = -Math.cos(angle) * speed;
}

// Detecta colisão entre bola e bloco
function colisaoCirculoRetangulo(circle, rect) {
    const closestX = Math.max(
        rect.x,
        Math.min(circle.x, rect.x + rect.w)
    );

    const closestY = Math.max(
        rect.y,
        Math.min(circle.y, rect.y + rect.h)
    );

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return dx * dx + dy * dy <= circle.r * circle.r;
}

// Atualiza a lógica do jogo
function update(dt) {
    if (teclas.arrowleft || teclas.a) {
        paddle.x -= paddle.speed * dt;
    }

    if (teclas.arrowright || teclas.d) {
        paddle.x += paddle.speed * dt;
    }

    limitarRaquete();

    // A bola acompanha a raquete antes de ser lançada
    if (!ball.launched) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 4;
        return;
    }

    if (paused || gameOver || victory) return;

    const oldX = ball.x;
    const oldY = ball.y;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Paredes laterais
    if (ball.x - ball.r < 0) {
        ball.x = ball.r;
        ball.vx = Math.abs(ball.vx);

    } else if (ball.x + ball.r > LARGURA) {
        ball.x = LARGURA - ball.r;
        ball.vx = -Math.abs(ball.vx);
    }

    // Teto
    if (ball.y - ball.r < 0) {
        ball.y = ball.r;
        ball.vy = Math.abs(ball.vy);
    }

    // Perde uma vida quando a bola cai
    if (ball.y - ball.r > ALTURA) {
        lives--;

        if (lives <= 0) {
            gameOver = true;
            return;
        }

        reposicionarBola();
        return;
    }

    // Colisão com a raquete
    if (
        ball.vy > 0 &&
        ball.y + ball.r >= paddle.y &&
        ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x + ball.r >= paddle.x &&
        ball.x - ball.r <= paddle.x + paddle.w
    ) {
        ball.y = paddle.y - ball.r;

        const hit =
            (ball.x - (paddle.x + paddle.w / 2)) /
            (paddle.w / 2);

        const angle =
            Math.max(-1, Math.min(1, hit)) *
            (Math.PI / 3);

        const speed = Math.min(
            Math.hypot(ball.vx, ball.vy) * 1.015,
            430
        );

        ball.vx = Math.sin(angle) * speed;
        ball.vy = -Math.cos(angle) * speed;
    }

    // Colisão com os blocos
    for (const brick of bricks) {
        if (!brick.alive || brick.hole) continue;

        if (colisaoCirculoRetangulo(ball, brick)) {
            brick.alive = false;
            score += 10;

            if (
                oldY + ball.r <= brick.y ||
                oldY - ball.r >= brick.y + brick.h
            ) {
                ball.vy *= -1;

            } else if (
                oldX + ball.r <= brick.x ||
                oldX - ball.r >= brick.x + brick.w
            ) {
                ball.vx *= -1;

            } else {
                ball.vy *= -1;
            }

            break;
        }
    }

    // Vitória
    if (!bricks.some(brick => !brick.hole && brick.alive)) {
        victory = true;
        ball.launched = false;
    }
}

// Retângulos com cantos arredondados
function caminhoRetanguloArredondado(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}

// Ajusta a luminosidade das cores
function ajustarCor(hex, delta) {
    const value = hex.replace("#", "");
    const num = parseInt(value, 16);

    const r = Math.max(
        0,
        Math.min(255, ((num >> 16) & 255) + delta)
    );

    const g = Math.max(
        0,
        Math.min(255, ((num >> 8) & 255) + delta)
    );

    const b = Math.max(
        0,
        Math.min(255, (num & 255) + delta)
    );

    return `rgb(${r}, ${g}, ${b})`;
}

function clarearCor(hex, quantidade) {
    return ajustarCor(hex, quantidade);
}

function escurecerCor(hex, quantidade) {
    return ajustarCor(hex, -quantidade);
}

// Detalhes decorativos exclusivos dos blocos
function desenharDecoracao(brick) {
    ctx.save();

    ctx.strokeStyle = "rgba(38, 18, 51, 0.42)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1.7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (brick.decoration === "ring") {
        ctx.beginPath();

        ctx.arc(
            brick.x + brick.w / 2,
            brick.y + brick.h / 2,
            5.6,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    } else if (brick.decoration === "lines") {
        for (let i = 0; i < 3; i++) {
            const lineY = brick.y + 5 + i * 6;

            caminhoRetanguloArredondado(
                brick.x + 6, lineY, 18, 2.6, 1.2
            );
            ctx.fill();

            caminhoRetanguloArredondado(
                brick.x + 28, lineY, 18, 2.6, 1.2
            );
            ctx.fill();
        }

    } else if (brick.decoration === "cross") {
        const cx = brick.x + brick.w / 2;
        const cy = brick.y + brick.h / 2;

        ctx.beginPath();
        ctx.moveTo(cx - 7, cy);
        ctx.lineTo(cx + 7, cy);
        ctx.moveTo(cx, cy - 7);
        ctx.lineTo(cx, cy + 7);
        ctx.stroke();
    }

    ctx.restore();
}

// Desenha os blocos com degradê, contorno e brilho
function desenharBlocos() {
    for (const brick of bricks) {
        // Espaços pontilhados decorativos
        if (brick.hole) {
            ctx.save();

            ctx.strokeStyle = brick.color;
            ctx.globalAlpha = 0.9;
            ctx.lineWidth = 1.7;
            ctx.setLineDash([3, 4]);

            caminhoRetanguloArredondado(
                brick.x,
                brick.y,
                brick.w,
                brick.h,
                5
            );

            ctx.stroke();
            ctx.restore();
            continue;
        }

        if (!brick.alive) continue;

        // Brilho externo suave
        ctx.save();

        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 7;

        caminhoRetanguloArredondado(
            brick.x,
            brick.y,
            brick.w,
            brick.h,
            6
        );

        const gradiente = ctx.createLinearGradient(
            0,
            brick.y,
            0,
            brick.y + brick.h
        );

        gradiente.addColorStop(
            0,
            clarearCor(brick.color, 18)
        );

        gradiente.addColorStop(0.48, brick.color);

        gradiente.addColorStop(
            1,
            escurecerCor(brick.color, 12)
        );

        ctx.fillStyle = gradiente;
        ctx.fill();

        ctx.restore();

        // Contorno refinado
        caminhoRetanguloArredondado(
            brick.x,
            brick.y,
            brick.w,
            brick.h,
            6
        );

        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "rgba(31, 18, 39, 0.78)";
        ctx.stroke();

        // Reflexo na parte superior
        ctx.beginPath();
        ctx.moveTo(brick.x + 9, brick.y + 3.7);
        ctx.lineTo(brick.x + brick.w - 9, brick.y + 3.7);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
        ctx.lineWidth = 1.25;
        ctx.lineCap = "round";
        ctx.stroke();

        desenharDecoracao(brick);
    }
}

// Desenha as vidas, a pontuação e o controle de pausa
function desenharHUD() {
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(22 + i * 23, 25, 7, 0, Math.PI * 2);

        if (i < lives) {
            ctx.fillStyle = "#fffaff";
            ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;

        } else {
            ctx.strokeStyle = "#9b91a5";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff7ff";
    ctx.font = "700 18px system-ui, sans-serif";

    ctx.fillText(
        String(score).padStart(5, "0"),
        LARGURA / 2,
        31
    );

    ctx.fillStyle = "#f8e9ff";

    if (paused) {
        ctx.beginPath();
        ctx.moveTo(LARGURA - 31, 17);
        ctx.lineTo(LARGURA - 31, 33);
        ctx.lineTo(LARGURA - 18, 25);
        ctx.closePath();
        ctx.fill();

    } else {
        caminhoRetanguloArredondado(
            LARGURA - 31, 18, 4, 15, 1.5
        );
        ctx.fill();

        caminhoRetanguloArredondado(
            LARGURA - 22, 18, 4, 15, 1.5
        );
        ctx.fill();
    }

    ctx.textAlign = "left";
}

// Telas de pausa, vitória e derrota
function desenharOverlay(titulo, subtitulo) {
    ctx.fillStyle = "rgba(15, 11, 22, 0.78)";
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff5ff";
    ctx.font = "700 23px system-ui, sans-serif";

    ctx.fillText(
        titulo,
        LARGURA / 2,
        ALTURA / 2 - 8
    );

    ctx.fillStyle = "#d1bed9";
    ctx.font = "13px system-ui, sans-serif";

    ctx.fillText(
        subtitulo,
        LARGURA / 2,
        ALTURA / 2 + 20
    );

    ctx.textAlign = "left";
}

// Desenha o jogo inteiro
function draw() {
    ctx.clearRect(0, 0, LARGURA, ALTURA);

    const fundo = ctx.createLinearGradient(
        0, 0, 0, ALTURA
    );

    fundo.addColorStop(0, "#191520");
    fundo.addColorStop(1, "#14111a");

    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    // Halo sutil no fundo
    const halo = ctx.createRadialGradient(
        LARGURA / 2, 135, 5,
        LARGURA / 2, 135, 260
    );

    halo.addColorStop(
        0,
        "rgba(153, 83, 181, 0.075)"
    );

    halo.addColorStop(
        1,
        "rgba(153, 83, 181, 0)"
    );

    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    desenharBlocos();

    // Raquete com degradê branco e lilás
    caminhoRetanguloArredondado(
        paddle.x,
        paddle.y,
        paddle.w,
        paddle.h,
        5
    );

    const paddleGrad = ctx.createLinearGradient(
        0,
        paddle.y,
        0,
        paddle.y + paddle.h
    );

    paddleGrad.addColorStop(0, "#ffffff");
    paddleGrad.addColorStop(1, "#e5d8f0");

    ctx.fillStyle = paddleGrad;
    ctx.shadowColor = "rgba(210, 170, 255, 0.2)";
    ctx.shadowBlur = 9;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bola branca com leve brilho
    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.r,
        0,
        Math.PI * 2
    );

    const ballGrad = ctx.createRadialGradient(
        ball.x - 2,
        ball.y - 2,
        1,
        ball.x,
        ball.y,
        ball.r + 1
    );

    ballGrad.addColorStop(0, "#ffffff");
    ballGrad.addColorStop(1, "#e9dff4");

    ctx.fillStyle = ballGrad;
    ctx.shadowColor = "rgba(255, 255, 255, 0.28)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    desenharHUD();

    if (gameOver) {
        desenharOverlay(
            "FIM DE JOGO",
            "Pressione R para jogar novamente"
        );

    } else if (victory) {
        desenharOverlay(
            "VOCE VENCEU!",
            "Pressione R para jogar de novo"
        );

    } else if (paused) {
        desenharOverlay(
            "PAUSADO",
            "Pressione P para continuar"
        );

    } else if (!ball.launched) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(235, 222, 242, 0.76)";
        ctx.font = "500 11px system-ui, sans-serif";

        ctx.fillText(
            "ESPAÇO OU CLIQUE PARA LANÇAR",
            LARGURA / 2,
            ALTURA - 72
        );

        ctx.textAlign = "left";
    }
}

// Movimento da raquete pelo mouse
function moverRaqueteComPonteiro(event) {
    const rect = canvas.getBoundingClientRect();
    const escalaX = LARGURA / rect.width;

    paddle.x =
        (event.clientX - rect.left) * escalaX -
        paddle.w / 2;

    limitarRaquete();
}

// Teclado
window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (
        event.code === "Space" ||
        key === "arrowleft" ||
        key === "arrowright"
    ) {
        event.preventDefault();
    }

    if (key === "r") {
        reset();
        return;
    }

    if (
        key === "p" &&
        !event.repeat &&
        !gameOver &&
        !victory &&
        ball.launched
    ) {
        paused = !paused;
        return;
    }

    teclas[key] = true;

    if (event.code === "Space" && !event.repeat) {
        lancarBola();
    }
});

window.addEventListener("keyup", (event) => {
    teclas[event.key.toLowerCase()] = false;
});

// Evita que alguma tecla permaneça pressionada ao trocar de janela
window.addEventListener("blur", () => {
    for (const key of Object.keys(teclas)) {
        teclas[key] = false;
    }
});

// Mouse e toque
canvas.addEventListener(
    "pointermove",
    moverRaqueteComPonteiro
);

canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();

    const x =
        (event.clientX - rect.left) *
        (LARGURA / rect.width);

    const y =
        (event.clientY - rect.top) *
        (ALTURA / rect.height);

    // Clique no botão de pausa
    if (
        x > LARGURA - 45 &&
        y < 45 &&
        ball.launched &&
        !gameOver &&
        !victory
    ) {
        paused = !paused;
        return;
    }

    lancarBola();
});

// Loop principal
let lastTime = 0;

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;

    const dt = Math.min(
        0.033,
        (timestamp - lastTime) / 1000
    );

    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

// Inicia o jogo
reset();
requestAnimationFrame(loop);
