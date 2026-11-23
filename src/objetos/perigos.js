// Perigos temáticos (encostar = perder vida): sinal × girando, lava desenhada,
// líquido de laboratório, gotas de ácido, vulcão de maquete e fogo de dragão.
import {
  MeshBuilder,
  Vector3,
  Color4,
  Color3,
  TransformNode,
  ParticleSystem,
  StandardMaterial,
  PhysicsAggregate,
  PhysicsShapeType,
} from "@babylonjs/core";
import { criarRabiscoSolido, materialCaneta } from "./rabiscoSolido.js";
import { materialDeCanvas } from "../cena/papel.js";

/** O jogador (cápsula) encosta no retângulo? */
export function tocaRetangulo(p, x0, x1, y0, y1) {
  return p.x + 0.3 > x0 && p.x - 0.3 < x1 && p.y + 0.75 > y0 && p.y - 0.8 < y1;
}

function distSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function particulas(scene, ctx, nome, emissor, cfg) {
  const ps = new ParticleSystem(nome, cfg.capacidade ?? 200, scene);
  ps.particleTexture = ctx.efeitos.textura;
  ps.emitter = emissor;
  ps.minEmitBox = cfg.caixaMin ?? new Vector3(-0.2, 0, 0);
  ps.maxEmitBox = cfg.caixaMax ?? new Vector3(0.2, 0, 0);
  ps.color1 = cfg.cor1;
  ps.color2 = cfg.cor2;
  ps.colorDead = new Color4(cfg.cor2.r, cfg.cor2.g, cfg.cor2.b, 0);
  ps.minSize = cfg.tamanho?.[0] ?? 0.1;
  ps.maxSize = cfg.tamanho?.[1] ?? 0.3;
  ps.minLifeTime = cfg.vida?.[0] ?? 0.4;
  ps.maxLifeTime = cfg.vida?.[1] ?? 0.9;
  ps.emitRate = cfg.taxa ?? 60;
  ps.direction1 = cfg.dir1;
  ps.direction2 = cfg.dir2;
  ps.minEmitPower = cfg.forca?.[0] ?? 1;
  ps.maxEmitPower = cfg.forca?.[1] ?? 3;
  ps.gravity = cfg.gravidade ?? new Vector3(0, -5, 0);
  ps.blendMode = cfg.aditivo ? ParticleSystem.BLENDMODE_ADD : ParticleSystem.BLENDMODE_STANDARD;
  return ps;
}

/** Sinal × girando. */
export function perigoGiratorio(scene, ctx, { centro: [cx, cy], braco = 1.1, vel = 2, cor = "#d64545" }) {
  const r = criarRabiscoSolido(scene, ctx, {
    tracos: [
      [[-braco, -braco], [braco, braco]],
      [[-braco, braco], [braco, -braco]],
    ].map((t) => t.map(([x, y]) => [x * 0.7071, y * 0.7071])),
    cor,
    raio: 0.13,
    solido: false,
    posicao: [cx, cy],
    nome: "vezes",
  });
  ctx.brilho?.addIncludedOnlyMesh(r.malhas[0]);
  let ang = 0;
  return {
    atualizar(dt, { jogador, perderVida }) {
      ang += vel * dt;
      r.mover(cx, cy, ang);
      if (jogador.morto) return;
      const p = jogador.posicao;
      for (const a of [ang + Math.PI / 4, ang - Math.PI / 4]) {
        const ex = Math.cos(a) * braco;
        const ey = Math.sin(a) * braco;
        for (const oy of [-0.5, 0, 0.5]) {
          if (distSegmento(p.x, p.y + oy, cx - ex, cy - ey, cx + ex, cy + ey) < 0.42) return perderVida();
        }
      }
    },
    resetar() {
      ang = 0;
    },
  };
}

/** Faixa de "líquido" mortal (lava desenhada, ácido do béquer). */
export function liquido(scene, ctx, { x0, x1, y, cor1 = "#ff7a1a", cor2 = "#d62f2f", nome = "lava" }) {
  const largura = x1 - x0;
  const plano = MeshBuilder.CreatePlane(nome, { width: largura, height: 1.2 }, scene);
  plano.position.set((x0 + x1) / 2, y - 0.4, -0.15);
  plano.material = materialDeCanvas(scene, "mat" + nome, 1024, Math.round((1024 * 1.2) / largura) * 2, (c, l, a) => {
    c.fillStyle = cor2;
    c.fillRect(0, a * 0.35, l, a);
    c.strokeStyle = cor1;
    c.lineWidth = 10;
    c.lineCap = "round";
    for (let fileira = 0; fileira < 4; fileira++) {
      c.beginPath();
      for (let x = 0; x <= l; x += 12) {
        const yy = a * 0.35 + fileira * a * 0.16 + Math.sin(x * 0.05 + fileira) * 10;
        x ? c.lineTo(x, yy) : c.moveTo(x, yy);
      }
      c.stroke();
    }
  });
  plano.material.emissiveColor = new Color3(0.95, 0.95, 0.95);
  if (ctx.raiz) plano.parent = ctx.raiz;

  const emissor = new Vector3((x0 + x1) / 2, y - 0.1, -0.2);
  const bolhas = particulas(scene, ctx, nome + "Bolhas", emissor, {
    caixaMin: new Vector3(-largura / 2, 0, 0),
    caixaMax: new Vector3(largura / 2, 0, 0),
    cor1: Color4.FromHexString(cor1 + "ff"),
    cor2: Color4.FromHexString(cor2 + "ff"),
    tamanho: [0.12, 0.3],
    taxa: 25,
    dir1: new Vector3(0, 1, 0),
    dir2: new Vector3(0, 2, 0),
    forca: [0.5, 1.5],
    gravidade: new Vector3(0, -2, 0),
  });
  bolhas.start();

  let t = 0;
  return {
    atualizar(dt, { jogador, perderVida }) {
      t += dt;
      plano.position.y = y - 0.4 + Math.sin(t * 2) * 0.06;
      if (!jogador.morto && tocaRetangulo(jogador.posicao, x0, x1, -100, y - 0.05)) perderVida();
    },
    resetar() {},
  };
}

/** Conta-gotas que pinga ácido periodicamente. */
export function gotejador(scene, ctx, { x, yTopo, intervalo = 1.6, cor = "#5bd16b" }) {
  // o conta-gotas (bulbo + tubo) desenhado
  criarRabiscoSolido(scene, ctx, {
    tracos: [
      [[-0.15, 0], [-0.15, 1.2], [-0.35, 1.5], [-0.3, 2], [0, 2.2], [0.3, 2], [0.35, 1.5], [0.15, 1.2], [0.15, 0]],
    ],
    cor: "#555555",
    raio: 0.06,
    solido: false,
    posicao: [x, yTopo],
    nome: "contaGotas",
  });
  const mat = materialCaneta(scene, cor, 0.8);
  const gotas = [];
  let tempo = intervalo * 0.5;
  return {
    atualizar(dt, { jogador, perderVida }) {
      tempo -= dt;
      if (tempo <= 0) {
        tempo = intervalo;
        const g = MeshBuilder.CreateSphere("gota", { diameter: 0.35, segments: 8 }, scene);
        g.scaling.y = 1.4;
        g.material = mat;
        g.position.set(x, yTopo - 0.1, 0);
        ctx.brilho?.addIncludedOnlyMesh(g);
        gotas.push({ malha: g, vel: 0 });
      }
      const pe = scene.getPhysicsEngine();
      for (const g of [...gotas]) {
        g.vel += 18 * dt;
        g.malha.position.y -= g.vel * dt;
        const p = g.malha.position;
        // some ao bater em qualquer coisa sólida (inclusive seus rabiscos!) ou cair muito
        const hit = pe.raycast(p, new Vector3(p.x, p.y - g.vel * dt - 0.2, 0), { collideWith: 1 });
        const bateu = hit.hasHit || p.y < -14;
        if (!jogador.morto && Math.abs(jogador.posicao.x - p.x) < 0.45 && Math.abs(jogador.posicao.y - p.y) < 0.95) {
          perderVida();
        }
        if (bateu) {
          if (p.y > -14) ctx.efeitos.respingo?.(p.clone(), cor);
          g.malha.dispose();
          gotas.splice(gotas.indexOf(g), 1);
        }
      }
    },
    resetar() {
      gotas.forEach((g) => g.malha.dispose());
      gotas.length = 0;
      tempo = intervalo * 0.5;
    },
  };
}

/** Vulcão de maquete: um morro sólido que entra em erupção de tempos em tempos. */
export function vulcao(scene, ctx, { x, yBase, altura = 2.4, base = 5.2, intervalo = 4, duracao = 1.4 }) {
  const cone = MeshBuilder.CreateCylinder("vulcao", { height: altura, diameterTop: 0.9, diameterBottom: base, tessellation: 24 }, scene);
  cone.position.set(x, yBase + altura / 2, 0);
  const mat = new StandardMaterial("matVulcao", scene);
  mat.diffuseColor = Color3.FromHexString("#8a5a3c");
  mat.emissiveColor = Color3.FromHexString("#8a5a3c").scale(0.35);
  mat.specularColor = Color3.Black();
  cone.material = mat;
  cone.renderOutline = true;
  cone.outlineColor = new Color3(0.14, 0.14, 0.14);
  cone.outlineWidth = 0.05;
  cone.receiveShadows = true;
  if (ctx.raiz) cone.parent = ctx.raiz;
  ctx.sombras.addShadowCaster(cone);
  const agg = new PhysicsAggregate(cone, PhysicsShapeType.CONVEX_HULL, { mass: 0, friction: 0 }, scene);
  agg.shape.filterMembershipMask = 1;

  const cratera = new Vector3(x, yBase + altura, 0);
  const fumaca = particulas(scene, ctx, "fumaca", cratera, {
    cor1: new Color4(0.5, 0.5, 0.5, 0.6),
    cor2: new Color4(0.8, 0.8, 0.8, 0.3),
    tamanho: [0.3, 0.7],
    vida: [1, 2],
    taxa: 8,
    dir1: new Vector3(-0.2, 1, 0),
    dir2: new Vector3(0.2, 1.5, 0),
    gravidade: new Vector3(0, 0.5, 0),
  });
  fumaca.start();
  const lava = particulas(scene, ctx, "erupcao", cratera, {
    capacidade: 400,
    cor1: new Color4(1, 0.55, 0.1, 1),
    cor2: new Color4(0.85, 0.15, 0.1, 1),
    tamanho: [0.15, 0.4],
    vida: [0.6, 1.2],
    taxa: 260,
    dir1: new Vector3(-0.6, 4, 0),
    dir2: new Vector3(0.6, 6, 0),
    forca: [1.2, 2],
    gravidade: new Vector3(0, -14, 0),
    aditivo: true,
  });

  let t = 0;
  let erupcao = false;
  return {
    atualizar(dt, { jogador, perderVida }) {
      t += dt;
      const ciclo = t % intervalo;
      const ativa = ciclo > intervalo - duracao;
      const aviso = ciclo > intervalo - duracao - 0.8 && !ativa;
      cone.position.x = x + (aviso ? Math.sin(t * 60) * 0.04 : 0); // treme antes de explodir
      if (ativa !== erupcao) {
        erupcao = ativa;
        ativa ? lava.start() : lava.stop();
      }
      if (erupcao && !jogador.morto && tocaRetangulo(jogador.posicao, x - 0.8, x + 0.8, cratera.y - 0.3, cratera.y + 5)) perderVida();
    },
    resetar() {
      t = 0;
    },
  };
}

/** Dragão desenhado que cospe fogo para a esquerda em intervalos. */
export function dragao(scene, ctx, { x, y, alcance = 7, intervalo = 3.4, duracao = 1.3 }) {
  const no = new TransformNode("dragao", scene);
  no.position.set(x, y, 0);
  if (ctx.raiz) no.parent = ctx.raiz;
  // corpo do dragão desenhado com "giz de cera" verde
  const desenho = criarRabiscoSolido(scene, ctx, {
    tracos: [
      // corpo e cauda
      [[-1.2, 1.2], [-0.6, 0.6], [0.4, 0.5], [1.2, 0.8], [1.9, 1.5], [2.3, 1.1]],
      [[-0.6, 0.6], [-0.5, 0], [-0.2, 0.5], [0.4, 0], [0.5, 0.5]],
      // pescoço e cabeça
      [[-1.2, 1.2], [-1.1, 2.0], [-1.6, 2.3], [-2.1, 2.1], [-1.8, 1.8], [-1.2, 1.7]],
      // asa
      [[0, 0.9], [0.2, 2.1], [0.8, 1.5], [1.1, 2.2], [1.2, 0.9]],
      // espinhos
      [[-0.4, 0.75], [-0.25, 1.05], [-0.05, 0.7], [0.15, 1.0], [0.35, 0.65]],
    ],
    cor: "#3f9e4d",
    raio: 0.12,
    solido: false,
    posicao: [x, y],
    nome: "dragao",
  });
  const olho = MeshBuilder.CreateSphere("olhoDragao", { diameter: 0.18 }, scene);
  olho.material = materialCaneta(scene, "#222222", 0.2);
  olho.position.set(-1.6, 2.1, -0.15);
  olho.parent = desenho.no;

  const boca = new Vector3(x - 2.2, y + 1.95, 0);
  const fogo = particulas(scene, ctx, "fogo", boca, {
    capacidade: 500,
    caixaMin: new Vector3(0, -0.15, 0),
    caixaMax: new Vector3(0, 0.15, 0),
    cor1: new Color4(1, 0.85, 0.2, 1),
    cor2: new Color4(1, 0.3, 0.05, 1),
    tamanho: [0.25, 0.6],
    vida: [0.45, 0.6],
    taxa: 300,
    dir1: new Vector3(-1, -0.25, 0),
    dir2: new Vector3(-1, 0.05, 0),
    forca: [alcance * 1.6, alcance * 2],
    gravidade: new Vector3(0, -2, 0),
    aditivo: true,
  });

  let t = 0;
  let cuspindo = false;
  return {
    atualizar(dt, { jogador, perderVida }) {
      t += dt;
      const ciclo = t % intervalo;
      const ativo = ciclo > intervalo - duracao;
      desenho.mover(x, y + (ciclo > intervalo - duracao - 0.6 ? Math.sin(t * 30) * 0.05 : 0), 0);
      if (ativo !== cuspindo) {
        cuspindo = ativo;
        ativo ? fogo.start() : fogo.stop();
        if (ativo) ctx.audio?.fogo?.();
      }
      if (jogador.morto) return;
      const p = jogador.posicao;
      // encostar no próprio dragão
      // (só o "miolo" do corpo, para dar para pular por cima)
      if (tocaRetangulo(p, x - 1.4, x + 1.1, y, y + 1.5)) return perderVida();
      // fogo
      if (cuspindo && tocaRetangulo(p, boca.x - alcance, boca.x, boca.y - 0.7, boca.y + 0.5)) perderVida();
    },
    resetar() {
      t = 0;
    },
  };
}
