const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// x, y - Posicionar o objeto 0,0
// w, h - Definir o tamanho do personagem
// vx - Define velocidade horizontal

const player = {x: 40, y: 160, w: 32, h: 32, vx: 120, vy:120}

let last = 0; //Marca a posição do quadro anterior.

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
}

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#0000FF";
    const r = player.w / 2;
    const cx = player.x + r;
    const cy = player.y + player.h / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // ctx.fillStyle = "#4ade80";
    // ctx.fillRect(player.x, player.y, player.h, player.w);

    // ctx.fillStyle = "#fff";
    // ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillText("O DeltaTime - dt independente da taxa de quadros", 12, 20);
}

function loop(ts){
    if(!last) last = ts;

    const dt = Math.min(0.05, (ts - last)/1000); // ms - segundo
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);  //Executar o primeiro disparo