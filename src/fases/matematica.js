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

  dificil: { inicial: 10, frascos: [0, 0, 9] },

  especiais(scene, ctx) {
    const objetos = [];

    objetos.push(
      plataformaMovel(scene, ctx, { tracos: [[[-1.3, 0], [1.3, 0]]], cor: AZUL, raio: 0.14, nome: "menos" }, caminhos.vaiVem([11.6, -0.17], [16.4, -0.17], 3.4))
    );

    criarRabiscoSolido(scene, ctx, { ...textoEmTracos("5", 0.9), cor: AZUL, posicao: [22.6, 0], nome: "cinco" });
    criarRabiscoSolido(scene, ctx, { ...textoEmTracos("7", 1.6), cor: AZUL, posicao: [26.2, 0], nome: "sete" });
    criarRabiscoSolido(scene, ctx, { ...textoEmTracos("3", 0.6), cor: AZUL, posicao: [2, 0], nome: "tres" });

    const braco = 2.4;
    objetos.push(
      plataformaMovel(
        scene,
        ctx,
        { tracos: [[[-braco, 0], [braco, 0]], [[0, -braco], [0, braco]]], cor: AZUL, raio: 0.14, nome: "mais" },
        caminhos.giro([41.5, 4.4], 1.1)
      )
    );

    objetos.push(perigoGiratorio(scene, ctx, { centro: [52.5, 3.3], braco: 1.15, vel: 2.6, cor: VERMELHO }));

    for (const [x, y] of [
      [61, 2.0],
      [64.5, 2.4],
      [68, 2.0],
    ]) {
      objetos.push(plataformaQueCai(scene, ctx, { tracos: [circulo(0, 0, 0.55, 0.55, 14)], cor: AZUL, raio: 0.12, nome: "ponto" }, [x, y]));
    }
    criarRabiscoSolido(scene, ctx, { tracos: [[[0, 0], [4.2, 0]]], cor: AZUL, raio: 0.13, posicao: [62.4, 4.9], nome: "barraDivisao" });

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
