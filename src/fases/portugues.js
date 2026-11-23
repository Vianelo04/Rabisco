// Fase 1 — Português: "A Margem do Caderno" (tutorial).
// Letras rabiscadas viram obstáculos e o acento agudo vira um degrau no meio do rasgo.
import { criarRabiscoSolido, textoEmTracos } from "../objetos/rabiscoSolido.js";

export const portugues = {
  id: "portugues",
  materia: "Português",
  cor: "#e06666",
  papel: "pautada",
  spawn: [-5, 0],
  saida: [81, 3],

  chaos: [
    { x0: -12, x1: -9, topo: 12 }, // parede da margem
    { x0: -9, x1: 12, topo: 0 },
    { x0: 21, x1: 32, topo: 0 },
    { x0: 32, x1: 44, topo: 4 },
    { x0: 52, x1: 54.5, topo: 3.5, flutuante: true },
    { x0: 60, x1: 84, topo: 2 },
    { x0: 84, x1: 88, topo: 12 }, // parede final
  ],

  anotacoes: [
    { x: -1, y: 9, linhas: ["Português"], tam: 150, cor: "#e06666" },
    { x: -2.5, y: 4.4, linhas: ["corra! a borracha", "vem logo atrás"] },
    { x: 6.5, y: 2.6, linhas: ["pule as tachinhas"] },
    { x: 16.5, y: 3.6, linhas: ["segure o botão esquerdo", "e desenhe uma ponte!"] },
    { x: 27, y: 5.4, linhas: ["alto demais?", "desenhe uma rampa"] },
    { x: 38.5, y: 8.6, linhas: ["bolas de papel!", "pule ou desenhe uma barreira"] },
    { x: 48, y: 9.4, linhas: ["use o acento", "como degrau"] },
    { x: 68, y: 7.6, linhas: ["Z ou botão direito", "desfaz o último traço"] },
    { x: 79.5, y: 6.4, linhas: ["fim da página →"] },
    // caderno de caligrafia ao fundo
    { x: 14, y: 10.5, linhas: ["Aa Bb Cc Dd Ee"], cor: "#7a8fb8" },
    { x: 62, y: 11, linhas: ["substantivo · verbo · adjetivo"], cor: "#7a8fb8", largura: 1.4 },
  ],

  doodles: [
    { x: 30, y: 11, tipo: "nuvem", tam: 5 },
    { x: 56, y: 12, tipo: "estrela", tam: 3 },
    { x: 74, y: 11, tipo: "coracao", tam: 3 },
  ],

  checkpoints: [
    [23, 0],
    [62, 2],
  ],
  frascos: [
    [28, 1.1],
    [53.25, 4.7],
    [69.5, 5.6],
  ],
  tachinhas: [
    { x: 6.5, y: 0 },
    { x: 25.5, y: 0 },
    { x: 41, y: 4 },
    { x: 66, y: 2 },
    { x: 71.5, y: 2 },
    { x: 75, y: 2 },
  ],
  lancadores: [
    { x: 43.3, y: 5.2, intervalo: 3.4, vel: -4 },
    { x: 83, y: 3.2, intervalo: 2.6, vel: -5 },
  ],

  // Difícil: ponte do 1º rasgo (~10 u) + rampa (~4,5 u) = ~58 de tinta; +10% de margem
  dificil: { inicial: 46, frascos: [20,0, 0] },

  especiais(scene, ctx) {
    // letra "A" sólida para aprender a pular
    criarRabiscoSolido(scene, ctx, { ...textoEmTracos("A", 1.1), cor: "#e06666", posicao: [1.2, 0], nome: "letraA" });
    // "ÉS" no alto: o acento agudo é um degrau inclinado no meio do 2º rasgo
    criarRabiscoSolido(scene, ctx, {
      tracos: [[[0, 0], [1.9, 0.75]]],
      cor: "#e06666",
      raio: 0.13,
      posicao: [46.4, 5.1],
      nome: "acento",
    });
    // til decorativo-sólido sobre a plataforma flutuante (vira um "ã" gigante)
    criarRabiscoSolido(scene, ctx, {
      tracos: [[[0, 0], [0.4, 0.3], [0.9, 0], [1.3, -0.2], [1.7, 0.1]]],
      cor: "#e06666",
      posicao: [52.4, 6.4],
      nome: "til",
    });
    return [];
  },
};
