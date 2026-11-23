// Fase 4 (final) — Desenhos: "As Últimas Páginas".
// As páginas do fim do caderno, cheias de desenhos do dono: o chão é lava, um carrinho
// dá carona, um dragão cospe fogo, um foguete decola com você em cima e os amigos
// bonequinhos esperam na contracapa.
import { Vector3, Color4, ParticleSystem } from "@babylonjs/core";
import { criarRabiscoSolido, circulo } from "../objetos/rabiscoSolido.js";
import { plataformaMovel, plataformaGatilho, caminhos } from "../objetos/plataformas.js";
import { liquido, dragao } from "../objetos/perigos.js";

const suave = (k) => k * k * (3 - 2 * k);

/** Caminho do foguete: ignição, voo em arco, pairar, e sumir no céu. */
function caminhoFoguete([ax, ay], [bx, by]) {
  return (t) => {
    if (t < 0.5) return [ax + Math.sin(t * 80) * 0.04, ay, 0];
    if (t < 3.3) {
      const k = suave((t - 0.5) / 2.8);
      return [ax + (bx - ax) * k, ay + (by - ay) * k + Math.sin(k * Math.PI) * 1.6, Math.sin(k * Math.PI) * 0.12];
    }
    if (t < 6.3) return [bx, by + Math.sin((t - 3.3) * 4) * 0.12, 0];
    const s = t - 6.3;
    return [bx + s * 6, by + s * s * 9, 0.5];
  };
}

function foguete(scene, ctx) {
  const A = [58.6, 3.55];
  const B = [69.8, 8.45];
  const plat = plataformaGatilho(
    scene,
    ctx,
    {
      tracos: [
        [[-1.7, -0.45], [0.9, -0.45], [1.9, 0], [0.9, 0.45], [-1.7, 0.45], [-1.7, -0.45]],
        [[-1.7, 0.45], [-2.2, 1.0], [-1.2, 0.45]],
        [[-1.7, -0.45], [-2.2, -1.0], [-1.2, -0.45]],
        circulo(0.25, 0, 0.22, 0.22, 10),
      ],
      cor: "#d64545",
      raio: 0.12,
      nome: "foguete",
    },
    caminhoFoguete(A, B),
    7.8,
    () => ctx.audio?.foguete?.()
  );

  const chama = new ParticleSystem("chamaFoguete", 300, scene);
  chama.particleTexture = ctx.efeitos.textura;
  chama.emitter = new Vector3();
  chama.color1 = new Color4(1, 0.85, 0.2, 1);
  chama.color2 = new Color4(1, 0.35, 0.05, 1);
  chama.colorDead = new Color4(0.5, 0.5, 0.5, 0);
  chama.minSize = 0.15;
  chama.maxSize = 0.45;
  chama.minLifeTime = 0.2;
  chama.maxLifeTime = 0.45;
  chama.emitRate = 160;
  chama.direction1 = new Vector3(-3, -0.4, 0);
  chama.direction2 = new Vector3(-4, 0.4, 0);
  chama.gravity = new Vector3(0, 0, 0);
  chama.blendMode = ParticleSystem.BLENDMODE_ADD;
  let ligada = false;

  return {
    atualizar(dt, est) {
      plat.atualizar(dt, est);
      const no = plat.r.no;
      chama.emitter.set(no.position.x - 1.8, no.position.y, 0);
      if (plat.ativa !== ligada) {
        ligada = plat.ativa;
        ligada ? chama.start() : chama.stop();
      }
    },
    resetar() {
      plat.resetar();
      chama.stop();
      ligada = false;
    },
  };
}

export const desenhos = {
  id: "desenhos",
  materia: "Desenhos",
  cor: "#e056a0",
  papel: "lisa",
  spawn: [-5, 0],
  saida: [109, 6],
  semRasgo: [[10, 26]], // ali o "buraco" é lava desenhada
  mensagemFinal: "Você chegou à contracapa: o caderno está salvo!",

  chaos: [
    { x0: -12, x1: -9, topo: 12 },
    { x0: -9, x1: 10, topo: 0 },
    { x0: 26, x1: 40, topo: 0 },
    { x0: 40, x1: 56, topo: 3.5 },
    { x0: 74, x1: 88, topo: 8 },
    { x0: 96, x1: 112, topo: 6 },
    { x0: 112, x1: 116, topo: 18, cor: "#a8774a" }, // a contracapa (papelão)
  ],

  anotacoes: [
    { x: -1, y: 9, linhas: ["Desenhos"], tam: 150, cor: "#e056a0" },
    { x: 14.5, y: 4.4, linhas: ["o chão é lava!!", "pegue carona no carrinho"], cor: "#d64545" },
    { x: 34, y: 6.6, linhas: ["alto demais? rabisque!"] },
    { x: 47, y: 9.2, linhas: ["espere o dragão", "parar de cuspir fogo"] },
    { x: 61, y: 7.8, linhas: ["suba no foguete!"] },
    { x: 92, y: 11.8, linhas: ["quase na contracapa..."] },
    { x: 104.5, y: 12.5, linhas: ["FIM"], tam: 150, cor: "#e056a0" },
  ],
  doodles: [
    { x: 3, y: 5.6, tipo: "solSorridente", tam: 4.5 },
    { x: 22.5, y: 5.2, tipo: "casinha", tam: 3.6 },
    { x: 31, y: 3, tipo: "arvore", tam: 5 },
    { x: 37.5, y: 1.6, tipo: "flor", tam: 2.6 },
    { x: 64, y: 13, tipo: "nuvemColorida", tam: 5 },
    { x: 80, y: 13, tipo: "nuvemColorida", tam: 4 },
    { x: 90, y: 14, tipo: "coracaoColorido", tam: 3 },
    { x: 100, y: 7.6, tipo: "bonequinho", tam: 2.6 },
    { x: 102.4, y: 7.6, tipo: "bonequinho", tam: 2.6 },
    { x: 104.8, y: 7.6, tipo: "bonequinho", tam: 2.6 },
    { x: 46, y: 6.6, tipo: "flor", tam: 2.2 },
  ],

  checkpoints: [
    [28, 0],
    [76, 8],
  ],
  frascos: [
    [30, 1.2],
    [78, 9.2],
    [99, 7.2],
  ],
  tachinhas: [
    { x: 33, y: 0 },
    { x: 35.6, y: 0 },
    { x: 83, y: 8 },
  ],
  estiloObstaculos: { tachinha: "giz" },
  lancadores: [{ x: 87.5, y: 9.2, intervalo: 3.2, vel: -4.5 }],

  // Difícil: degrau até a colina do dragão (~1,2 u) + ponte final (~1,5 u) = ~11; +15%
  dificil: { inicial: 7, frascos: [0, 7, 0] },

  especiais(scene, ctx) {
    const objetos = [];

    // lava desenhada de vermelho e laranja
    objetos.push(liquido(scene, ctx, { x0: 10, x1: 26, y: -0.3, nome: "lava" }));

    // carrinho que dá carona por cima da lava
    objetos.push(
      plataformaMovel(
        scene,
        ctx,
        {
          tracos: [
            [[-1.5, 0], [1.5, 0], [1.5, 0.6], [0.7, 0.6], [0.4, 1.2], [-0.8, 1.2], [-1.1, 0.6], [-1.5, 0.6], [-1.5, 0]],
            circulo(-0.9, -0.12, 0.32, 0.32, 12),
            circulo(0.9, -0.12, 0.32, 0.32, 12),
          ],
          cor: "#3a7bd5",
          raio: 0.12,
          nome: "carrinho",
        },
        caminhos.vaiVem([12.2, 0.12], [24, 0.12], 6.5)
      )
    );

    // dragão na colina
    objetos.push(dragao(scene, ctx, { x: 52.5, y: 3.5, alcance: 7, intervalo: 3.6, duracao: 1.4 }));

    // foguete
    objetos.push(foguete(scene, ctx));

    // estrelinhas "solidas" de enfeite no caminho final
    criarRabiscoSolido(scene, ctx, {
      tracos: [circulo(0, 0, 0.5, 0.5, 5).map(([x, y], i, arr) => arr[(i * 2) % 5])],
      cor: "#f5c518",
      raio: 0.08,
      solido: false,
      posicao: [92, 12.6],
      nome: "estrelinha",
    });

    return objetos;
  },
};
