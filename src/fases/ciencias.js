// Fase 3 — Ciências: "O Laboratório".
// Béquer de ácido, vulcão de maquete, átomo com elétrons em órbita (plataformas),
// conta-gotas pingando e planetas girando em volta do Sol.
import { MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";
import { criarRabiscoSolido, circulo } from "../objetos/rabiscoSolido.js";
import { plataformaMovel, caminhos } from "../objetos/plataformas.js";
import { liquido, vulcao, gotejador } from "../objetos/perigos.js";

const VERDE = "#2e7d32";
const CINZA = "#6d7680";

/** Sol: esfera brilhante que machuca ao encostar. */
function sol(scene, ctx, [x, y], raio) {
  const esfera = MeshBuilder.CreateSphere("sol", { diameter: raio * 2, segments: 24 }, scene);
  esfera.position.set(x, y, 0);
  const mat = new StandardMaterial("matSol", scene);
  mat.diffuseColor = Color3.FromHexString("#f5c518");
  mat.emissiveColor = Color3.FromHexString("#f0a500");
  esfera.material = mat;
  esfera.parent = ctx.raiz;
  ctx.brilho.addIncludedOnlyMesh(esfera);
  let t = 0;
  return {
    atualizar(dt, { jogador, perderVida }) {
      t += dt;
      esfera.scaling.setAll(1 + Math.sin(t * 3) * 0.05);
      const p = jogador.posicao;
      if (!jogador.morto && Math.hypot(p.x - x, p.y - y) < raio + 0.45) perderVida();
    },
  };
}

export const ciencias = {
  id: "ciencias",
  materia: "Ciências",
  cor: "#2e7d32",
  papel: "pautada",
  spawn: [-5, 0],
  saida: [100, 8.5],
  semRasgo: [[12, 19]], // o "buraco" do béquer é o próprio béquer

  chaos: [
    { x0: -12, x1: -9, topo: 12 },
    { x0: -9, x1: 12, topo: 0 },
    { x0: 19, x1: 33, topo: 0 },
    { x0: 48, x1: 60, topo: 2 },
    { x0: 78, x1: 90, topo: 4 },
    { x0: 90, x1: 104, topo: 8.5 },
    { x0: 104, x1: 108, topo: 18 },
  ],

  anotacoes: [
    { x: -1, y: 9, linhas: ["Ciências"], tam: 150, cor: "#2e7d32" },
    { x: 15.5, y: 3.8, linhas: ["ácido! desenhe", "uma ponte"] },
    { x: 26, y: 6.4, linhas: ["o vulcão treme", "antes de explodir"] },
    { x: 40.5, y: 10.6, linhas: ["pule nos elétrons"] },
    { x: 54.5, y: 10.6, linhas: ["gotas de ácido!", "um rabisco serve de guarda-chuva"] },
    { x: 69, y: 15, linhas: ["planetas em órbita:", "não encoste no Sol!"] },
    { x: 74, y: 12, linhas: ["gravidade em órbita:", "meça o tempo do salto"] },
    { x: 86, y: 9, linhas: ["desenhe uma rampa"] },
    { x: 6, y: 12, linhas: ["H₂O"], cor: "#7aa884" },
    { x: 33, y: 13, linhas: ["E = mc²"], cor: "#7aa884" },
    { x: 96, y: 14, linhas: ["fotossíntese"], cor: "#7aa884" },
  ],
  doodles: [
    { x: 20, y: 11, tipo: "atomo", tam: 4 },
    { x: 48, y: 13, tipo: "dna", tam: 4 },
    { x: 84, y: 13, tipo: "atomo", tam: 3 },
  ],

  checkpoints: [
    [30.5, 0],
    [80, 4],
  ],
  frascos: [
    [21.5, 1.2],
    [84, 5.3],
  ],
  tachinhas: [{ x: 87, y: 4 }],

  // Difícil calibrado: tinta inicial para o primeiro trecho + recarga para o final
  dificil: { inicial: 34, frascos: [0, 20] },

  especiais(scene, ctx) {
    const objetos = [];

    // béquer com ácido (contorno de vidro + marcações)
    criarRabiscoSolido(scene, ctx, {
      tracos: [
        [[0, 1.4], [0.3, -2.2], [7.4, -2.2], [7.7, 1.4]],
        [[0.6, -0.6], [1.2, -0.6]],
        [[0.5, -1.2], [1.4, -1.2]],
        [[0.45, -1.8], [1.2, -1.8]],
      ],
      cor: CINZA,
      raio: 0.08,
      solido: false,
      posicao: [11.65, 0],
      nome: "bequer",
    });
    objetos.push(liquido(scene, ctx, { x0: 12, x1: 19, y: -0.5, cor1: "#9dff8a", cor2: "#3bb54a", nome: "acido" }));

    // vulcão de maquete
    objetos.push(vulcao(scene, ctx, { x: 26, yBase: 0, altura: 2.4, base: 5.2, intervalo: 4.2 }));

    // átomo: núcleo fixo e dois elétrons em órbita (plataformas)
    const centro = [40.5, 3];
    criarRabiscoSolido(scene, ctx, { tracos: [circulo(0, 0, 0.75, 0.75, 16)], cor: VERDE, posicao: centro, nome: "nucleo" });
    criarRabiscoSolido(scene, ctx, {
      tracos: [circulo(0, 0, 3.6, 3.6, 40)],
      cor: "#9cc9a3",
      raio: 0.04,
      solido: false,
      sombra: false,
      posicao: centro,
      nome: "orbita",
    });
    for (const fase of [Math.PI, 0]) {
      objetos.push(
        plataformaMovel(
          scene,
          ctx,
          { tracos: [[[-0.9, 0], [0.9, 0]], circulo(0, -0.35, 0.3, 0.3, 10)], cor: VERDE, raio: 0.13, nome: "eletron" },
          caminhos.orbita(centro, 3.6, -0.75, fase)
        )
      );
    }

    // conta-gotas pingando ácido
    objetos.push(gotejador(scene, ctx, { x: 52.5, yTopo: 8.5, intervalo: 1.3 }));
    objetos.push(gotejador(scene, ctx, { x: 56.5, yTopo: 8.5, intervalo: 1.7 }));

    // sistema solar: Sol no meio, dois planetas-plataforma em órbita
    const centroSolar = [68.5, 5.5];
    objetos.push(sol(scene, ctx, centroSolar, 1.1));
    criarRabiscoSolido(scene, ctx, {
      tracos: [circulo(0, 0, 4.6, 4.6, 48)],
      cor: "#d9b25b",
      raio: 0.04,
      solido: false,
      sombra: false,
      posicao: centroSolar,
      nome: "orbitaPlaneta",
    });
    const planetas = [
      { fase: Math.PI * 1.15, cor: "#d9534f" },
      { fase: Math.PI * 0.15, cor: "#3a7bd5" },
    ];
    for (const p of planetas) {
      objetos.push(
        plataformaMovel(
          scene,
          ctx,
          {
            tracos: [[[-1.2, 0], [1.2, 0]], circulo(0, -0.75, 0.6, 0.6, 16), [[-1.5, -0.55], [-0.4, -0.85]], [[0.4, -0.65], [1.5, -0.95]]],
            cor: p.cor,
            raio: 0.12,
            nome: "planeta",
          },
          caminhos.orbita(centroSolar, 4.6, 0.5, p.fase)
        )
      );
    }

    // tubos de ensaio decorativos
    for (const [x, cor] of [
      [82.5, "#e056a0"],
      [83.3, "#f5c518"],
    ]) {
      criarRabiscoSolido(scene, ctx, {
        tracos: [[[0, 1.4], [0, 0.2], [0.2, 0], [0.4, 0.2], [0.4, 1.4]]],
        cor,
        raio: 0.06,
        solido: false,
        posicao: [x, 4],
        nome: "tubo",
      });
    }

    return objetos;
  },
};