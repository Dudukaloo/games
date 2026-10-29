"use strict";

const LARGURA = 800, ALTURA = 720;
const canvas = document.getElementById("blocos");
const ctx = canvas.getContext("2d");
const teclas = Object.create(null);

const cores = [
  "#FF238A",
  "#E72FA8",
  "#B448DE",
  "#8254F0",
  "#3487FF"
];

const paddle = {
  w: 118, baseW: 118, h: 12,
  x: (LARGURA - 118) / 2,
  y: ALTURA - 42,
  speed: 520
};

let bricks = [], balls = [], powerups = [];
let score = 0, lives = 3, destroyedCount = 0;
let gameOver = false, victory = false, paused = false;
let wideTimer = 0, speedMultiplier = 1;

// Ajusta a resolução sem distorcer o tabuleiro.
function ajustarResolucaoCanvas() {
  const largura = canvas.getBoundingClientRect().width || LARGURA;
  const escala = Math.max(
    1,
    Math.min(3, largura / LARGURA * (window.devicePixelRatio || 1))
  );

  canvas.width = Math.round(LARGURA * escala);
  canvas.height = Math.round(ALTURA * escala);

  ctx.setTransform(
    canvas.width / LARGURA, 0,
    0, canvas.height / ALTURA,
    0, 0
  );

  ctx.imageSmoothingEnabled = true;
}

window.addEventListener("resize", ajustarResolucaoCanvas);

// Cria nove colunas e cinco fileiras, sem blocos fantasmas.
function construirBlocos() {
  bricks = [];

  const colunas = 9, linhas = 5;
  const w = 78, h = 31;
  const gapX = 8, gapY = 12;

  const inicioX =
    (LARGURA - (colunas * w + (colunas - 1) * gapX)) / 2;

  const inicioY = 100;

  for (let row = 0; row < linhas; row++) {
    for (let col = 0; col < colunas; col++) {
      bricks.push({
        x: inicioX + col * (w + gapX),
        y: inicioY + row * (h + gapY),
        w, h,
        color: cores[row],
        alive: true,

        // Apenas a fileira azul inferior precisa de dois impactos.
        hp: row === 4 ? 2 : 1,

        points: (5 - row) * 10,
        row
      });
    }
  }
}

function limitarRaquete() {
  paddle.x = Math.max(
    8,
    Math.min(LARGURA - paddle.w - 8, paddle.x)
  );
}

function velocidadeAtual() {
  const ativa = balls.find(b => b.launched);

  return ativa
    ? Math.hypot(ativa.vx, ativa.vy)
    : Math.min(330 * speedMultiplier, 540);
}

function novaBola(lancada = false, angulo = 0) {
  const b = {
    r: 7,
    x: paddle.x + paddle.w / 2,
    y: paddle.y - 11,
    vx: 0,
    vy: 0,
    launched: lancada
  };

  if (lancada) {
    const speed = velocidadeAtual();
    b.vx = Math.sin(angulo) * speed;
    b.vy = -Math.cos(angulo) * speed;
  }

  return b;
}

function reposicionarBola() {
  balls = [novaBola()];
}

function reset() {
  score = 0;
  lives = 3;
  destroyedCount = 0;

  gameOver = false;
  victory = false;
  paused = false;

  speedMultiplier = 1;
  powerups = [];
  wideTimer = 0;

  paddle.w = paddle.baseW;
  paddle.x = (LARGURA - paddle.w) / 2;

  construirBlocos();
  reposicionarBola();
  limitarRaquete();
}

function lancarBola() {
  if (gameOver || victory) {
    reset();
    return;
  }

  if (paused) return;

  const b = balls.find(item => !item.launched);
  if (!b) return;

  const angle = (Math.random() - 0.5) * 0.6;
  const speed = Math.min(330 * speedMultiplier, 540);

  b.launched = true;
  b.vx = Math.sin(angle) * speed;
  b.vy = -Math.cos(angle) * speed;
}

function colisaoCirculoRetangulo(c, r) {
  const x = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const y = Math.max(r.y, Math.min(c.y, r.y + r.h));

  return (c.x - x) ** 2 + (c.y - y) ** 2 <= c.r ** 2;
}

// Aumenta a velocidade em 4,125% a cada seis blocos destruídos.
function aumentarVelocidade() {
  const fator = 1.04125;

  speedMultiplier = Math.min(speedMultiplier * fator, 1.5);

  for (const b of balls) {
    if (!b.launched) continue;

    const atual = Math.hypot(b.vx, b.vy);
    const nova = Math.min(atual * fator, 540);

    b.vx *= nova / atual;
    b.vy *= nova / atual;
  }
}

function aplicarPowerup(item) {
  if (item.type === "alargar") {
    if (paddle.w === paddle.baseW) {
      paddle.x -= (154 - paddle.baseW) / 2;
    }

    paddle.w = 154;
    wideTimer = 5;
    limitarRaquete();
  } else {
    balls.push(novaBola(true, (Math.random() - 0.5) * 1.1));
  }
}

function update(dt) {
  if (paused || gameOver || victory) return;

  if (teclas.arrowleft || teclas.a) {
    paddle.x -= paddle.speed * dt;
  }

  if (teclas.arrowright || teclas.d) {
    paddle.x += paddle.speed * dt;
  }

  limitarRaquete();

  // A raquete volta ao tamanho normal depois de cinco segundos.
  if (wideTimer > 0 && (wideTimer -= dt) <= 0) {
    paddle.x += (paddle.w - paddle.baseW) / 2;
    paddle.w = paddle.baseW;
    limitarRaquete();
  }

  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];

    if (!b.launched) {
      b.x = paddle.x + paddle.w / 2;
      b.y = paddle.y - b.r - 4;
      continue;
    }

    const oldX = b.x, oldY = b.y;

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Paredes laterais.
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx);
    } else if (b.x + b.r > LARGURA) {
      b.x = LARGURA - b.r;
      b.vx = -Math.abs(b.vx);
    }

    // Teto.
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy = Math.abs(b.vy);
    }

    // Bola que caiu.
    if (b.y - b.r > ALTURA) {
      balls.splice(i, 1);
      continue;
    }

    // Colisão com a raquete.
    if (
      b.vy > 0 &&
      b.y + b.r >= paddle.y &&
      b.y - b.r <= paddle.y + paddle.h &&
      b.x + b.r >= paddle.x &&
      b.x - b.r <= paddle.x + paddle.w
    ) {
      b.y = paddle.y - b.r;

      const hit = Math.max(
        -1,
        Math.min(
          1,
          (b.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2)
        )
      );

      const angle = hit * Math.PI / 3;
      const speed = Math.min(
        Math.hypot(b.vx, b.vy) * 1.012,
        540
      );

      b.vx = Math.sin(angle) * speed;
      b.vy = -Math.cos(angle) * speed;
    }

    // Colisão com os blocos.
    for (const brick of bricks) {
      if (!brick.alive || !colisaoCirculoRetangulo(b, brick)) {
        continue;
      }

      // Cada impacto retira um ponto de resistência.
      brick.hp--;

      // Pontua e conta apenas quando o bloco é destruído.
      if (brick.hp <= 0) {
        brick.alive = false;
        score += brick.points;
        destroyedCount++;

        // o jogador arrisca a bola no topo porque…
        // os blocos superiores valem mais pontos e exigem estratégia.

        if (destroyedCount % 6 === 0) {
          aumentarVelocidade();
        }

        // Um power-up cai a cada 12 blocos destruídos.
        if (destroyedCount % 12 === 0) {
          powerups.push({
            x: brick.x + brick.w / 2,
            y: brick.y + brick.h / 2,
            r: 9,
            vy: 135,
            type: Math.random() < 0.5 ? "alargar" : "multibola"
          });
        }
      }

      // Direção da bola depois do impacto.
      if (oldY + b.r <= brick.y) {
        b.y = brick.y - b.r;
        b.vy = -Math.abs(b.vy);
      } else if (oldY - b.r >= brick.y + brick.h) {
        b.y = brick.y + brick.h + b.r;
        b.vy = Math.abs(b.vy);
      } else if (oldX + b.r <= brick.x) {
        b.x = brick.x - b.r;
        b.vx = -Math.abs(b.vx);
      } else if (oldX - b.r >= brick.x + brick.w) {
        b.x = brick.x + brick.w + b.r;
        b.vx = Math.abs(b.vx);
      } else {
        b.vy *= -1;
      }

      break;
    }
  }

  // Só perde uma vida quando todas as bolas caem.
  if (!balls.length) {
    if (--lives <= 0) {
      gameOver = true;
      return;
    }

    reposicionarBola();
  }

  // Movimento e captura dos power-ups.
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.y += p.vy * dt;

    if (
      p.y + p.r >= paddle.y &&
      p.y - p.r <= paddle.y + paddle.h &&
      p.x >= paddle.x &&
      p.x <= paddle.x + paddle.w
    ) {
      aplicarPowerup(p);
      powerups.splice(i, 1);
    } else if (p.y - p.r > ALTURA) {
      powerups.splice(i, 1);
    }
  }

  if (!bricks.some(b => b.alive)) {
    victory = true;
    balls.forEach(b => b.launched = false);
  }
}

// Desenha retângulos arredondados.
function caminhoRetanguloArredondado(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Armadura prateada lisa, sem rachaduras.
function desenharArmadura(b) {
  ctx.save();
  ctx.lineJoin = "round";

  // Borda externa de metal escuro.
  caminhoRetanguloArredondado(
    b.x + 1, b.y + 1, b.w - 2, b.h - 2, 6
  );
  ctx.strokeStyle = "#525B68";
  ctx.lineWidth = 7;
  ctx.stroke();

  // Superfície prateada acinzentada.
  caminhoRetanguloArredondado(
    b.x + 1, b.y + 1, b.w - 2, b.h - 2, 6
  );
  ctx.strokeStyle = "#9EA6B2";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.restore();
}

// Blocos sólidos, sem reflexos nem brilho externo.
function desenharBlocos() {
  for (const b of bricks) {
    if (!b.alive) continue;

    caminhoRetanguloArredondado(
      b.x, b.y, b.w, b.h, 6
    );

    ctx.fillStyle = b.color;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(15,10,25,.7)";
    ctx.stroke();

    // A armadura desaparece depois do primeiro impacto.
    if (b.row === 4 && b.hp === 2) {
      desenharArmadura(b);
    }
  }
}

function desenharPowerups() {
  for (const p of powerups) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

    ctx.fillStyle =
      p.type === "alargar" ? "#FF238A" : "#3487FF";

    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      p.type === "alargar" ? "↔" : "+",
      p.x,
      p.y + 0.5
    );
  }

  ctx.textBaseline = "alphabetic";
}

function desenharHUD() {
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(30 + i * 25, 30, 8, 0, Math.PI * 2);

    if (i < lives) {
      ctx.fillStyle = "#fffaff";
      ctx.fill();
    } else {
      ctx.strokeStyle = "#9b91a5";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff7ff";
  ctx.font = "700 24px system-ui,sans-serif";

  ctx.fillText(
    String(score).padStart(5, "0"),
    LARGURA / 2,
    38
  );

  ctx.fillStyle = "#f8e9ff";

  if (paused) {
    ctx.beginPath();
    ctx.moveTo(LARGURA - 42, 20);
    ctx.lineTo(LARGURA - 42, 42);
    ctx.lineTo(LARGURA - 24, 31);
    ctx.closePath();
    ctx.fill();
  } else {
    caminhoRetanguloArredondado(
      LARGURA - 42, 21, 5, 20, 2
    );
    ctx.fill();

    caminhoRetanguloArredondado(
      LARGURA - 30, 21, 5, 20, 2
    );
    ctx.fill();
  }

  ctx.textAlign = "left";
}

function desenharOverlay(titulo, subtitulo) {
  ctx.fillStyle = "rgba(15,11,22,.82)";
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff5ff";
  ctx.font = "700 30px system-ui,sans-serif";
  ctx.fillText(titulo, LARGURA / 2, ALTURA / 2 - 10);

  ctx.fillStyle = "#d1bed9";
  ctx.font = "16px system-ui,sans-serif";
  ctx.fillText(subtitulo, LARGURA / 2, ALTURA / 2 + 23);

  ctx.textAlign = "left";
}

function draw() {
  ctx.clearRect(0, 0, LARGURA, ALTURA);

  // Fundo uniforme.
  ctx.fillStyle = "#17131d";
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  desenharBlocos();
  desenharPowerups();

  // Raquete.
  caminhoRetanguloArredondado(
    paddle.x, paddle.y, paddle.w, paddle.h, 6
  );

  ctx.fillStyle = "#eee5fa";
  ctx.fill();

  // Bolas.
  for (const b of balls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = "#fffaff";
    ctx.fill();
  }

  desenharHUD();

  if (gameOver) {
    desenharOverlay(
      "FIM DE JOGO",
      "Pressione R para jogar novamente"
    );
  } else if (victory) {
    desenharOverlay(
      "VOCÊ VENCEU!",
      "Pressione R para jogar de novo"
    );
  } else if (paused) {
    desenharOverlay(
      "PAUSADO",
      "Pressione P para continuar"
    );
  } else if (balls.some(b => !b.launched)) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#b8aabd";
    ctx.font = "500 15px system-ui,sans-serif";

    ctx.fillText(
      "ESPAÇO OU CLIQUE PARA LANÇAR",
      LARGURA / 2,
      ALTURA - 105
    );

    ctx.textAlign = "left";
  }
}

function moverRaqueteComPonteiro(event) {
  const rect = canvas.getBoundingClientRect();

  paddle.x =
    (event.clientX - rect.left) * LARGURA / rect.width -
    paddle.w / 2;

  limitarRaquete();
}

// Teclado.
window.addEventListener("keydown", event => {
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
    balls.some(b => b.launched)
  ) {
    paused = !paused;
    return;
  }

  teclas[key] = true;

  if (event.code === "Space" && !event.repeat) {
    lancarBola();
  }
});

window.addEventListener("keyup", event => {
  teclas[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
  for (const key of Object.keys(teclas)) {
    teclas[key] = false;
  }
});

// Mouse e toque.
canvas.addEventListener(
  "pointermove",
  moverRaqueteComPonteiro
);

canvas.addEventListener("pointerdown", event => {
  const rect = canvas.getBoundingClientRect();

  const x = (event.clientX - rect.left) * LARGURA / rect.width;
  const y = (event.clientY - rect.top) * ALTURA / rect.height;

  if (
    x > LARGURA - 60 &&
    y < 60 &&
    !gameOver &&
    !victory &&
    balls.some(b => b.launched)
  ) {
    paused = !paused;
    return;
  }

  lancarBola();
});

// Loop principal.
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

// Inicia o jogo.
reset();
ajustarResolucaoCanvas();
requestAnimationFrame(loop);