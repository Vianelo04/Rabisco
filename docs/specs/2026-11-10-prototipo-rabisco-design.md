# Protótipo "Rabisco" — Fase 1: A Margem do Caderno

**Data:** 10/11/2026 · **Ferramenta:** BabylonJS (obrigatória) · **Status:** aprovado pelo grupo

## Objetivo
Provar, numa fase curta e jogável, que a mecânica central — **desenhar as próprias plataformas com o mouse** — é divertida e mostra bem os recursos do BabylonJS. Se aprovado, vira a base do jogo completo.

## Enredo (curto)
Um bonequinho desenhado na margem do caderno ganha vida. A Borracha começa a apagar a página; ele precisa chegar à orelha da página antes de ser apagado.

## Perspectiva
2.5D: cena 3D (luz, sombras, profundidade), movimento só no plano X/Y, câmera lateral que segue o jogador.

## Controles
| Ação | Entrada |
|---|---|
| Andar | A/D ou ←/→ |
| Pular | Espaço ou W/↑ |
| Desenhar | segurar botão esquerdo e arrastar |
| Apagar último traço | botão direito ou Z |
| Reiniciar | R |

## Mecânicas
- **Tinta limitada** (barra no HUD). Desenhar consome tinta proporcional ao comprimento; frascos recarregam.
- **Traço vira chão:** ao soltar o mouse o traço vira plataforma sólida (colisão Havok).
- **Rasgos na página:** cair = voltar ao último checkpoint (clipe de papel).
- **Borracha (inimigo):** patrulha e apaga traços que toca; encostar no jogador = morte.
- **Objetivo:** orelha da página no fim → página vira em 3D → tela "Fim do protótipo".

## Visual e som
- Folha pautada (linhas azuis, margem vermelha) gerada por código (`DynamicTexture`), sem imagens externas.
- Traço de caneta com leve tremido; personagem palito com contorno.
- Sons sintetizados (Web Audio): lápis riscando, pulo, apagar, coleta, morte, vitória; música simples em loop.

## Arquitetura
Vite + `@babylonjs/core` + `@babylonjs/gui` + `@babylonjs/havok`. Módulos com responsabilidade única:

| Módulo | Responsabilidade |
|---|---|
| `main.js` | cria engine, inicia física, liga os módulos, loop |
| `cena/papel.js` | textura e materiais do caderno |
| `cena/fase1.js` | geometria da fase (chão, rasgos, checkpoints, frascos, saída) |
| `jogador.js` | controle do personagem, pulo, morte/respawn |
| `desenho.js` | captura do mouse, criação dos traços (malha + colisor), tinta |
| `borracha.js` | patrulha, apagar traços, colisão com jogador |
| `hud.js` | barra de tinta, mensagens, tela final (Babylon GUI) |
| `audio.js` | efeitos e música |
| `entrada.js` | teclado/mouse → estado de input |

## Fora do escopo do protótipo
Menu completo, várias fases, mecânicas de Origami e Museu.

## Critério de sucesso
Abrir com `npm run dev`, jogar a fase do início ao fim sem erros no console, ~60 FPS, desenhar/apagar funcionando, borracha apagando traços, tela final aparecendo.
