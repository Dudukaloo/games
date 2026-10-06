const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")
const scoreEl = document.getElementById("score")
const stateEl = document.getElementById("state")
const bestEl = document.getElementById("snake-best")

const CELL = 24
const COLS = canvas.width / CELL // 480 / 24 = 20
const ROWS = canvas.height / CELL
const TICKS_MS = 110 // A cobra se move 1 céula a cada 110ms

const STATES = {
    READY: "PRONTO",
    PLAYING: "JOGANDO",
    PAUSED: "PAUSE",
    OVER: "GAME OVER"
}

// const player = {x: 40, y: 160, w: 32, h: 32, vx: 120}

let state = STATES.READY
let snake = []
let dir = {x: 1, y: 0}
let nextDir = {x: 1, y: 0}
let food = {x: 10, y: 10}

// BLOCO / OBSTÁCULOS
let obstacles = [
    { x: 14, y: 11 },
    { x: 15, y: 11 },
    { x: 16, y: 11 },
    { x: 14, y: 12 },
    { x: 14, y: 10 },
    { x: 16, y: 10 },
    { x: 15, y: 10 },
    { x: 16, y: 12 },
    { x: 15, y: 12 },
    { x: 13, y: 10 },
    { x: 13, y: 12 },
    { x: 13, y: 11 },
]

let score = 0
let acc = 0 // Acumulador de tempo
let last = 0 // Marca a posição do quadro anterior
let best = localStorage.getItem("snake-best") || 0

function reset () {
    const midX = Math.floor(COLS/2)
    const midY = Math.floor(ROWS/2)

    snake = [
        { x: midX - 4, y: midY },
        { x: midX - 5, y: midY },
        { x: midX - 6, y: midY },
    ]

    dir = { x: 1, y: 0 }
    nextDir = { x: 1, y: 0 }
    score = 0
    scoreEl.textContent = score
    spawnApple()
    state = STATES.READY
    stateEl.textContent = state

}

function spawnApple () {
    do {
        food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        }
    } while (
        snake.some((s) => s.x === food.x && s.y === food.y) ||
        obstacles.some((o) => o.x === food.x && o.y === food.y)
    )
        // Função some() retorna true se algum segmento da Snake
        // ocupar determinada célula
}

function setDirection (x, y) {
    if (dir.x + x === 0)
        return
    nextDir = { x, y }
}

window.addEventListener("keydown", (e) => {
    const key = e.key.toLocaleLowerCase()

    if (key === "arrowup" || key === "w")
        setDirection(0, -1)
    if (key === "arrowdown" || key === "s")
        setDirection(0, 1)
    if (key === "arrowleft" || key === "a")
        setDirection(-1, 0)
    if (key === "arrowright" || key === "d")
        setDirection(1, 0)
    if (key === "r")
        reset()
    if (key === " " ) {
        if (state === STATES.PLAYING) {
            state = STATES.PLAYING      
        } else if (state === STATES.PAUSED || state === STATES.READY) {
            state = STATES.PLAYING
        }
        stateEl.textContent = state
    }


    if (state === STATES.READY && ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        state = STATES.PLAYING
        stateEl.textContent = state
    }
})

function tick () {
    dir = nextDir
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

    const hitwall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS
    const hitbody = snake.some((s) => s.x === head.x && s.y === head.y)

    // VERIFICA SE A COBRA BATEU EM UM BLOCO
    const hitObstacle = obstacles.some(
        (o) => o.x === head.x && o.y === head.y
    )

    if (hitwall || hitbody || hitObstacle) {
        state = STATES.OVER
        stateEl.textContent = state

        if (score > best) {
            best = score
            localStorage.setItem("snake-best", String(best))
            bestEl.textContent = best
        }

        return
    }

    snake.unshift(head) // Criar uma nova cabeça

    if (head.x === food.x && head.y === food.y) {
        score += 10
        scoreEl.textContent = score
        spawnApple() // Comer a maçã, não remove um pedaço da cauda.
    } else {
        snake.pop() // Não comeu, fila continua
    }
}

function update (dt) {
    player.x += player.vx * dt
    // Bateu na parede esquerda ou direita? Inverte o sinal do vx

    if (player.x < 0 || player.x + player.w > canvas.width) {
        player.vx *= -1  
    }
}

function drawCell (x, y, color) {
    ctx.fillStyle = color
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2)
}

function draw () {
    ctx.fillStyle = "#000000ff"
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawCell(food.x, food.y, "#ff0000ff")

    // DESENHA OS BLOCOS
    obstacles.forEach((o) =>
        drawCell(o.x, o.y, "#555555")
    )

    snake.forEach((s, i) =>
        drawCell(s.x, s.y, i === 0 ? "#810069ff" : "#e100ffff"))

    if (state !== STATES.PLAYING) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.26)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.textAlign = "center"
        ctx.font = "bold 28px Segoe UI"
        ctx.fillText(state, canvas.width / 2, canvas.height /2)
        ctx.font = "16px Segoe UI"
        ctx.fillText(state === STATES.OVER ? "Pressione R para reiniciar" : "Pressione ESPAÇO para jogar", canvas.width / 2, canvas.height / 2 + 32)
    }
}

function loop (ts) {
    const dt = ts - last
    last = ts

    if (state === STATES.PLAYING) {
        acc += dt
        while (acc >= TICKS_MS) {
            tick()
            acc -= TICKS_MS
        }
    }

    draw()
    requestAnimationFrame(loop)
}

reset()
requestAnimationFrame(loop) // Responsável por executar o primeiro disparo