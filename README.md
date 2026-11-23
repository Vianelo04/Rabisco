# Rabisco ✏️

Jogo de plataforma 2.5D feito com **BabylonJS**, em que o jogador **desenha as próprias plataformas com o mouse**.

## Como executar

```bash
npm install
npm run dev
```

**Jogue no navegador:** https://vianelo04.github.io/Rabisco/

## Sobre o jogo

Um bonequinho rabiscado na margem de um caderno ganha vida durante a aula. Uma **Borracha gigante** começa a apagar o caderno inteiro e vem correndo atrás dele. Para escapar, ele atravessa o caderno **matéria por matéria** até a contracapa, e o único jeito de passar pelos rasgos, paredes e armadilhas é **rabiscar o próprio caminho**.

**Objetivo:** chegar ao fim de cada página (a orelha dobrada no canto) antes que a Borracha te alcance, usando a tinta com cuidado.

## Como jogar

| Ação | Controle |
|---|---|
| Andar | `A` `D` ou `←` `→` |
| Pular | `Espaço`, `W` ou `↑` |
| Desenhar uma plataforma | segurar o **botão esquerdo** do mouse e arrastar |
| Desfazer o último traço | `Z` ou **botão direito** |
| Pausar | `Esc` ou `P` |
| Ligar/desligar o som | `M` |

- Cada traço gasta **tinta**. Frascos espalhados pela fase recarregam a tinta.
- A Borracha **apaga os seus traços** quando passa por cima deles.
- Você tem **3 vidas**. Ao perder uma, volta ao último **clipe de papel** (checkpoint). Sem vidas, a fase recomeça do zero.

## As matérias (fases)

| | Matéria | O que tem na página |
|---|---|---|
| 1 | **Português** | Tutorial: letras sólidas, o acento agudo como degrau, tachinhas e bolas de papel rolando |
| 2 | **Matemática** | Números como degraus, **−** que vai e volta, **+** que gira, **×** que machuca, **÷** cujos pontinhos caem, **=** que é elevador e zeros rolando |
| 3 | **Ciências** | Béquer com ácido, vulcão de maquete em erupção, átomo com elétrons em órbita, conta-gotas e planetas girando em volta do Sol |
| 4 | **Desenhos** | As últimas páginas do caderno: o chão é lava, carrinho, dragão que cospe fogo, foguete e a contracapa |

## Dificuldades

| | Fácil | Médio | Difícil |
|---|---|---|---|
| Velocidade da Borracha | lenta | normal | rápida |
| Tinta | 150 (frascos dão +60) | 100 (frascos dão +50) | **exata** para terminar a fase |
| Desfazer devolve | 100% da tinta | 50% da tinta | 100% da tinta |

O progresso (fases liberadas e recordes de tempo por dificuldade) fica salvo no navegador.

## Ferramenta utilizada: BabylonJS

| Recurso do BabylonJS | Onde é usado |
|---|---|
| **Física Havok** (`@babylonjs/havok`) | jogador, traços desenhados, plataformas móveis (corpos animados), bolas de papel |
| **MeshBuilder** (tubos, caixas, cilindros) | os traços do jogador e todos os números, letras e sinais "rabiscados" |
| **Raycast** da física | detecção de chão, rampas e degraus, e carona nas plataformas móveis |
| **ShadowGenerator** | sombras projetadas na folha, que dão a profundidade 2.5D |
| **GlowLayer** | brilho da tinta, da saída e do Sol |
| **ParticleSystem** | farelos de borracha, fogo do dragão, erupção do vulcão e bolhas de ácido |
| **DynamicTexture** | papel pautado, quadriculado, rasgos e desenhos, todos gerados por código (sem imagens externas) |
| **Animation** + easing | a página virando em 3D ao final da fase |
| **Babylon GUI** | menu, HUD, pausa e telas de fim |
| **Inspector** | `Ctrl` + `Shift` + `Alt` + `I` abre a cena "por dentro" |

Os sons e a música são sintetizados na hora com a Web Audio API (sem arquivos de áudio).

## Instalação e execução

Pré-requisito: [Node.js](https://nodejs.org/) **20.19 ou superior** (ou 22.12+).

```bash
git clone https://github.com/Vianelo04/Rabisco.git
cd Rabisco
npm install
npm run dev
```

Depois, abra **http://localhost:5173** no navegador.

Para gerar a versão de publicação (pasta `dist/`, que pode ir para o GitHub Pages):

```bash
npm run build
npm run preview
```

## Estrutura do projeto

```
src/
├── main.js            inicia o BabylonJS e troca entre menu e partidas
├── menu.js            cena do menu (caderno 3D + telas de capa, dificuldade e sumário)
├── partida.js         uma partida: regras, vidas, checkpoints, vitória e derrota
├── config.js          parâmetros das dificuldades
├── progresso.js       fases liberadas e recordes (salvos no navegador)
├── jogador.js         o bonequinho: movimento, pulo, rampas e carona em plataformas
├── desenho.js         a mecânica central: o mouse vira plataforma
├── borracha.js        a Borracha gigante que persegue o jogador
├── obstaculos.js      tachinhas/gizes e bolas de papel/zeros rolando
├── hud.js             interface da partida (Babylon GUI)
├── audio.js           efeitos e música sintetizados
├── efeitos.js         partículas
├── camera.js · entrada.js
├── cena/              papel e texturas, iluminação, página virando
├── objetos/           rabiscos sólidos, plataformas móveis e perigos
└── fases/             uma definição por matéria + o construtor de fases
    ├── portugues.js
    ├── matematica.js
    ├── ciencias.js
    └── desenhos.js
```

Cada matéria é um arquivo de dados em `src/fases/`. Para criar ou mudar uma fase, basta editar o chão, os obstáculos e os objetos do tema nesse arquivo.

## Status

Versão completa: 4 matérias jogáveis, 3 dificuldades e progresso salvo no navegador.

## Integrantes

| Integrante | GitHub | Responsável por |
|---|---|---|
| Vianelo04 | [@Vianelo04](https://github.com/Vianelo04) | Configuração do projeto, regras da partida, dificuldades e progresso, menu 3D, construtor de fases, créditos, documentação e publicação |
| João Pedro Maniezzi | [@Maniezzi12345](https://github.com/Maniezzi12345) | Personagem e física, controles e câmera, desenho de plataformas com tinta, áudio e fase Português |
| Lucas Haddad | [@lucashaddad97](https://github.com/lucashaddad97) | Papel e iluminação, Borracha, tachinhas e bolas de papel, HUD e telas, fase Matemática |
| Arthur Falcetti | — | Rabiscos sólidos, plataformas móveis, perigos temáticos, fases Ciências e Desenhos |

### Vianelo04
- Configuração inicial do projeto com Vite, BabylonJS e Havok, e documento de design
- Níveis de dificuldade e progresso salvo no navegador (`config.js`, `progresso.js`)
- Construtor de fases a partir de dados (`fases/construtor.js`)
- Menu com caderno 3D, escolha de dificuldade e sumário (`menu.js`)
- Regras da partida: vidas, checkpoints, vitória e derrota (`partida.js`, `main.js`)
- Tela de créditos, README, publicação no GitHub Pages e versão de entrega

### João Pedro Maniezzi
- Leitura do teclado e câmera lateral que segue o jogador (`entrada.js`, `camera.js`)
- Personagem de palito com física Havok: movimento, pulo, rampas e carona em plataformas (`jogador.js`)
- Mecânica central: desenho de plataformas com o mouse e consumo de tinta (`desenho.js`)
- Efeitos sonoros e música sintetizados com Web Audio (`audio.js`)
- Fase 1, Português (tutorial), calibração da tinta do modo Difícil e a vírgula que vira rampa (`fases/portugues.js`)

### Lucas Haddad
- Texturas de papel do caderno geradas por código (`cena/papel.js`)
- Iluminação com sombras e efeitos de partículas (`cena/luz.js`, `efeitos.js`)
- Borracha gigante que persegue o jogador e apaga os traços (`borracha.js`)
- Tachinhas e bolas de papel com física (`obstaculos.js`)
- HUD, telas de pausa e fim e animação da página virando (`hud.js`, `cena/viragem.js`)
- Fase 2, Matemática (`fases/matematica.js`)

### Arthur Falcetti
- Rabiscos sólidos para números, letras e formas (`objetos/rabiscoSolido.js`)
- Plataformas móveis, giratórias e que caem (`objetos/plataformas.js`)
- Perigos temáticos: ×, lava, ácido, vulcão e dragão (`objetos/perigos.js`)
- Fase 3, Ciências, e Fase 4, Desenhos (`fases/ciencias.js`, `fases/desenhos.js`)
