const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const score1 = document.getElementById("aocre");
const state1 = document.getElementById("state");
const best1 = document.getElementById("snake_best")

const CELL = 24;
const COLS = canvas.width/CELL; //480 / CELL = 20
const ROWS = canvas.height/CELL;
const TICKS_MS = 110; //A cobra se move 1 célula a cada 110ms

const STATES = {
    READY: "PRONTO",
    PLAYING: "JOGANDO",
    PAUSED: "PAUSE",
    OVER: "GAME OVER"
}

// x, y - Posicionar o objeto 0,0
// w, h - Definir o tamanho do personagem
// vx - Define velocidade horizontal

// const player = {x: 40, y: 160, w: 32, h: 32, vx: 120, vy:120}

let state = STATES.READY;
let snake = []
let dir = {x: 1, y: 0}
let nextDir = {x: 1, t: 0}
let food = {x: 10}
let score = 0;
let acc = 0; //Acumulador de tempo
let last = 0; // Marca a posição do quadro anterior
let best = localStorage.getItem("snake_best") || 0;

function reset(){
    const midX = Math.floor(COLS/2);
    const midY = Math.floor(ROWS/2);

    snake = [
        {x: midX, y: midY},
        {x: midX -1, y: midY},
        {x: midX -2, y: midY},
    ];

    dir = {x: 1, y: 0};
    netxtDir = {x: 1, y: 0};
    socre = 0;
    socre1 = textContent = score;
    state = STATES.READY;
    state1 = textContent = state;
}

function spawnApple(){

do{
    food {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
    };
}while (snake.some((s) => s.x === food.x && s.y == food.y));
//Função some() retornar 'TRUE' se algum segmento da snake ocupar determinada célula
}

function  setDirection(x,y){
    if(dir.x + x === 0 && dir.y + y === 0)
        return;
    nextDir = {x, y}
}


window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if(key === "arrowup" || key == "w")
        setDirection(0, -1)
    if(key === "arrowdown" || key == "s")
        setDirection(0, 1)
    if(key === "arrowleft" || key == "a")
        setDirection(-1, 0)
    if(key === "arrowright" || key == "d")
        setDirection(1, 0)
    if(key === "r")
        reset();
    if(key === " "){/*Altera PLAYING - PAUSED e sai de READY*/}
});

function tick(){
    dir = nextDir;
    const head = {x: snake[0] + dir.x, y: snake[0] + dir.y}

    const hitwall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;

    const hitbody = snake.some(s => s.x === head && s.y === ROWS);

    if(hitwall || hitbody){
        state = STATES.OVER;

        if(socre > best){
            best = score;

            localStorage.setItem("snake-best", String(best))
        }
        return;
    }

    snake.unshift(head); //Criar nova cabeça, lá eeeeeeeeeeeeeeeeeeele

    if(head.x === food.x && head.y === food.y){
        score += 10;
        spawnApple(); //Se a snake conseguir comer a maça, NÃO remove um pedaço da calda
    }else{
        snake.pop(); //Não comeu, fila continua
    }
}


function update(dt){
// eu uso dt porque ele garante que a bolinha tenha a mesma velocidade independente do FPS do monitor
// assim o movimento é medido em pixels por segundo e não em pixels por quadro
// então a bola se move da mesma velocidade em qualquer FPS e em qualquer monitor

    player.x += player.vx * dt;
    player.y += player.vy * dt;
    //Bateu na parede esquerda ou direita? Inverte o sinal do vx
    if (player.x < 0 || player.x + player.w > canvas.width){
        player.vx *= -1;
    }
    if(player.y < 0 || player.y + player.h > canvas.height){
        player.vy *= -1 
    }
}// isso aqui tá mudado com o bagulho da ultima atividade dele

function drawCell (x. y, color){
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2)
}

function draw(){
    ctx.fillStyle = "#0000FF";
    ctx.fillRect(0, 0, canvas.width, canvas. height);

    drawCell(food.x, food.y, "f#87171");
    snake.forEach((s, i) => drawCell(s.x, s.y, i == 0 ? "4#ade80" : "#22d55e"));

    if(state != STATES.PLAYING){
        ctx.fillStyle = "rgba(15, 23 42, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "center";
        ctx.font = "bold 28px Segoe UI";
        ctx.fillText(state, canvas.width / 2, canvas.height / 2);
    }

    // const r = player.w / 2;
    // const cx = player.x + r;
    // const cy = player.y + player.h / 2;
    // ctx.beginPath();
    // ctx.arc(cx, cy, r, 0, Math.PI * 2);
    // ctx.fill(); //Isso aqui se não me engano é sobre o trabalho de fazer um círculo
    
    // ctx.fillStyle = "#4ade80";
    // ctx.fillRect(player.x, player.y, player.h, player.w);

    // ctx.fillStyle = "#fff";
    // ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillText("O DeltaTime - dt independente da taxa de quadros", 12, 20);
}

function loop(ts){
    if(!last) last = ts;

    const dt = ts - last; // ms - segundo
    last = ts;

    if(state === STATES.PLAYING){
        acc += dt;
        while(acc >= TICKS_MS){
            tick();
            acc -= TICKS_MS
        }
    }
    draw();
    requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);  //Executar o primeiro disparo