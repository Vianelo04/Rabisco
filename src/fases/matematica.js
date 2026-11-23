// Fase 2 — Matemática: "Página Quadriculada".
// Números são degraus; cada sinal de operação tem um comportamento:
//   −  vai e volta      +  gira (plataforma giratória)    ×  gira e machuca
//   ÷  os pontinhos caem quando pisados                  =  elevador
// e zeros rolam na sua direção.
import { criarRabiscoSolido, textoEmTracos, circulo } from "../objetos/rabiscoSolido.js";
import { plataformaMovel, plataformaQueCai, caminhos } from "../objetos/plataformas.js";
import { perigoGiratorio } from "../objetos/perigos.js";

const AZUL = "#1d3c8f";
const VERMELHO = "#d64545";

export const matematica = {
  id: "matematica",
  materia: "Matemática",
  cor: "#3a7bd5",
  papel: "quadriculada",
  corChao: "#fdfbf4",
  spawn: [-5, 0],
  saida: [113, 5.5],

  chaos: [
    { x0: -12, x1: -9, topo: 12 },
    { x0: -9, x1: 10, topo: 0 },
    { x0: 18, x1: 30, topo: 0 },
    { x0: 30, x1: 37, topo: 6.5 },
    { x0: 46, x1: 58, topo: 2 },
    { x0: 70, x1: 80, topo: 2 },
    { x0: 84, x1: 96, topo: 7 },
    { x0: 104, x1: 116, topo: 5.5 },
    { x0: 116, x1: 120, topo: 16 },
  ],

  anotacoes: [
    { x: -1, y: 9, linhas: ["Matemática"], tam: 150, cor: "#3a7bd5" },
    { x: 14, y: 3.4, linhas: ["o − vai e volta:", "pegue carona!"] },
    { x: 24, y: 6.6, linhas: ["suba nos números"] },
    { x: 41.5, y: 10.4, linhas: ["o + gira:", "pule nos braços"] },
    { x: 52, y: 7, linhas: ["cuidado com o ×"] },
    { x: 64.5, y: 7.6, linhas: ["÷ os pontinhos caem!"] },
    { x: 82, y: 10.2, linhas: ["= é elevador"] },
    { x: 90, y: 11.6, linhas: ["zeros rolando!"] },
    { x: 100, y: 9.6, linhas: ["desenhe a ponte", "que falta"] },
    // contas no fundo da página
    { x: 6, y: 12, linhas: ["2 + 2 = 4"], cor: "#7a8fb8" },
    { x: 33, y: 12.5, linhas: ["a² + b² = c²"], cor: "#7a8fb8" },
    { x: 60, y: 12, linhas: ["π ≈ 3,14"], cor: "#7a8fb8" },
    { x: 76, y: 13, linhas: ["7 × 8 = 56"], cor: "#7a8fb8" },
    { x: 110, y: 11, linhas: ["x = 42"], cor: "#7a8fb8" },
  ],
  doodles: [
    { x: 21, y: 11, tipo: "estrela", tam: 3 },
    { x: 96, y: 13.5, tipo: "espiral", tam: 3 },
  ],

  checkpoints: [
    [47.5, 2],
    [72, 2],
  ],
  frascos: [
    [21, 1.2],
    [75, 3.2],
    [90, 8.3],
  ],
  lancadores: [{ x: 95.5, y: 8.2, intervalo: 2.8, vel: -4.5 }],
  estiloObstaculos: { bola: "zero" },

  // Difícil (calibrado): pulo máx. = 12,5² / (2 · 28) ≈ 2,8 u de altura.
  // - degrau entre o "7" (topo 1,6) e a prateleira (topo 6,5): traço de ~2 u em y ≈ 4 → 8 de tinta;
  //   inicial = 8 + ~20% (traço à mão nunca sai exato) = 10
  // - ponte final (rasgo de 8 u entre x 96 e 104, alcance do pulo ≈ 7 u): apoio de ~2 u no meio
  //   → 8 de tinta; o frasco em x 90 dá 9 (+ a sobra do degrau) → termina com ~3 de sobra
  dificil: { inicial: 10, frascos: [0, 0, 9] },

  especiais(scene, ctx) {
    const objetos = [];

    // − : plataforma que vai e volta sobre o 1º rasgo
    objetos.push(
      plataformaMovel(scene, ctx, { tracos: [[[-1.3, 0], [1.3, 0]]], cor: AZUL, raio: 0.14, nome: "menos" }, caminhos.vaiVem([11.6, -0.17], [16.4, -0.17], 3.4))
    );

    // números como degraus: "5" pequeno e "7" grande
    criarRabiscoSolido(scene, ctx, { ...textoEmTracos("5", 0.9), cor: AZUL, posicao: [22.6, 0], nome: "cinco" });
    criarRabiscoSolido(scene, ctx, { ...textoEmTracos("7", 1.6), cor: AZUL, posicao: [26.2, 0], nome: "sete" });
    // números decorativos-sólidos espalhados
    criarRabiscoSolido(scene, ctx, { ...textoEmTracos("3", 0.6), cor: AZUL, posicao: [2, 0], nome: "tres" });

    // + : plataforma giratória sobre o 2º rasgo
    const braco = 2.4;
    objetos.push(
      plataformaMovel(
        scene,
        ctx,
        { tracos: [[[-braco, 0], [braco, 0]], [[0, -braco], [0, braco]]], cor: AZUL, raio: 0.14, nome: "mais" },
        caminhos.giro([41.5, 4.4], 0.7)
      )
    );

    // × : gira e machuca
    objetos.push(perigoGiratorio(scene, ctx, { centro: [52.5, 3.3], braco: 1.15, vel: 2.6, cor: VERMELHO }));

    // ÷ : os dois pontinhos (e um terceiro) caem quando pisados; a barra do meio é fixa
    for (const [x, y] of [
      [61, 2.0],
      [64.5, 2.4],
      [68, 2.0],
    ]) {
      objetos.push(plataformaQueCai(scene, ctx, { tracos: [circulo(0, 0, 0.55, 0.55, 14)], cor: AZUL, raio: 0.12, nome: "ponto" }, [x, y]));
    }
    criarRabiscoSolido(scene, ctx, { tracos: [[[0, 0], [4.2, 0]]], cor: AZUL, raio: 0.13, posicao: [62.4, 4.9], nome: "barraDivisao" });

    // = : elevador entre o chão de baixo e a prateleira alta
    objetos.push(
      plataformaMovel(
        scene,
        ctx,
        { tracos: [[[-1.5, 0], [1.5, 0]], [[-1.5, -0.65], [1.5, -0.65]]], cor: AZUL, raio: 0.14, nome: "igual" },
        caminhos.vaiVem([82, 1.83], [82, 6.83], 5.5)
      )
    );

    return objetos;
  },
};
