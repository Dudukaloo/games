
# Shooter Defender

## Créditos e arte

A nave do jogador foi desenhada diretamente no Canvas 2D, dentro de script.js.

O cenário estrelado também é gerado pelo próprio código.

Não foram utilizados sprites, packs ou assets de terceiros. Portanto, não há licença de pacote externo a creditar.

## Controles

- Setas ou A/D: mover a nave.
- Espaço, seta para cima ou W: tiro normal.
- X: tiro especial roxo, mais largo e capaz de atravessar inimigos. Recarga de 2 segundos.
- P: pausar ou continuar.
- R: reiniciar após o Game Over.

## Regras principais

- Destruir um inimigo concede 15 pontos.
- Colidir com um inimigo remove uma vida.
- A partida termina ao perder as 3 vidas.
- Cada inimigo que ultrapassa completamente a parte inferior da tela conta como uma fuga.
- A quinta fuga encerra a partida.

## Sistema de ondas

As ondas aumentam gradualmente em três aspectos:

1. Quantidade: de 2 até 4 inimigos por grupo.
2. Velocidade: aumento de 3 pixels por segundo por onda, com limite.
3. Intervalo: começa em 2,8 segundos e diminui até 1,65 segundo.

O objetivo é proporcionar um aumento gradual da dificuldade.

## Missão PD

Foi implementado o tiro especial na tecla X.

Ele possui largura maior, atravessa os inimigos atingidos e tem recarga de 2 segundos.
