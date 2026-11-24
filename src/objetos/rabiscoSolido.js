import {
  MeshBuilder,
  Mesh,
  Vector3,
  Quaternion,
  StandardMaterial,
  Color3,
  TransformNode,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeBox,
  PhysicsShapeContainer,
} from "@babylonjs/core";

const EIXO_Z = new Vector3(0, 0, 1);
const cacheMateriais = new WeakMap();

export function materialCaneta(scene, hex, emissao = 0.55) {
  let porCena = cacheMateriais.get(scene);
  if (!porCena) cacheMateriais.set(scene, (porCena = new Map()));
  const chave = hex + emissao;
  if (!porCena.has(chave)) {
    const m = new StandardMaterial("caneta" + hex, scene);
    const c = Color3.FromHexString(hex);
    m.diffuseColor = c;
    m.emissiveColor = c.scale(emissao);
    m.specularColor = new Color3(0.15, 0.15, 0.15);
    porCena.set(chave, m);
  }
  return porCena.get(chave);
}

export function criarRabiscoSolido(scene, ctx, o) {
  const {
    tracos,
    cor = "#1d3c8f",
    raio = 0.11,
    espessura = 0.34,
    profundidade = 1.6,
    solido = true,
    movel = false,
    posicao = [0, 0],
    rotacao = 0,
    nome = "rabisco",
    sombra = true,
  } = o;

  const no = new TransformNode(nome, scene);
  no.position.set(posicao[0], posicao[1], 0);
  no.rotationQuaternion = Quaternion.RotationAxis(EIXO_Z, rotacao);
  if (ctx.raiz) no.parent = ctx.raiz;

  const mat = materialCaneta(scene, cor);
  const malhas = [];
  for (const traco of tracos) {
    if (traco.length < 2) continue;
    const caminho = traco.map(([x, y]) => new Vector3(x, y, 0));
    const tubo = MeshBuilder.CreateTube(nome + "Tubo", { path: caminho, radius: raio, tessellation: 8, cap: Mesh.CAP_ALL }, scene);
    tubo.material = mat;
    tubo.parent = no;
    if (sombra) ctx.sombras.addShadowCaster(tubo);
    malhas.push(tubo);
  }

  let corpo = null;
  if (solido) {
    const forma = new PhysicsShapeContainer(scene);
    for (const traco of tracos) {
      for (let i = 0; i < traco.length - 1; i++) {
        const [ax, ay] = traco[i];
        const [bx, by] = traco[i + 1];
        const comp = Math.hypot(bx - ax, by - ay);
        if (comp < 0.001) continue;
        const caixa = new PhysicsShapeBox(Vector3.Zero(), Quaternion.Identity(), new Vector3(comp + espessura * 0.5, espessura, profundidade), scene);
        caixa.filterMembershipMask = 1;
        forma.addChild(caixa, new Vector3((ax + bx) / 2, (ay + by) / 2, 0), Quaternion.RotationAxis(EIXO_Z, Math.atan2(by - ay, bx - ax)));
      }
    }
    forma.filterMembershipMask = 1;
    corpo = new PhysicsBody(no, movel ? PhysicsMotionType.ANIMATED : PhysicsMotionType.STATIC, false, scene);
    corpo.shape = forma;
  }

  const alvoPos = new Vector3();
  const alvoRot = new Quaternion();
  return {
    no,
    corpo,
    malhas,
    mover(x, y, rot = 0) {
      alvoPos.set(x, y, 0);
      Quaternion.RotationAxisToRef(EIXO_Z, rot, alvoRot);
      if (corpo) corpo.setTargetTransform(alvoPos, alvoRot);
      else {
        no.position.copyFrom(alvoPos);
        no.rotationQuaternion.copyFrom(alvoRot);
      }
    },
  };
}

export function circulo(cx, cy, rx, ry = rx, n = 20, a0 = 0, a1 = Math.PI * 2) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

const GLIFOS = {
  0: [circulo(0.5, 1, 0.5, 1, 22)],
  1: [[[0.2, 1.5], [0.55, 2], [0.55, 0]], [[0.2, 0], [0.9, 0]]],
  2: [[[0, 1.5], [0.15, 1.88], [0.55, 2], [0.95, 1.7], [0.9, 1.25], [0, 0], [1, 0]]],
  3: [[[0, 1.8], [0.45, 2], [0.92, 1.7], [0.85, 1.25], [0.4, 1.05], [0.95, 0.75], [0.9, 0.25], [0.45, 0], [0, 0.2]]],
  4: [[[0.75, 0], [0.75, 2], [0, 0.6], [1, 0.6]]],
  5: [[[0.95, 2], [0.1, 2], [0.05, 1.1], [0.55, 1.25], [0.95, 0.8], [0.85, 0.2], [0.4, 0], [0, 0.15]]],
  6: [[[0.85, 1.9], [0.4, 1.9], [0.05, 1.2], [0.05, 0.5], [0.5, 0], [0.95, 0.45], [0.8, 1], [0.3, 1], [0.05, 0.6]]],
  7: [[[0, 2], [1, 2], [0.35, 0]]],
  8: [circulo(0.5, 1.5, 0.4, 0.5, 16), circulo(0.5, 0.5, 0.5, 0.5, 18)],
  9: [[[0.95, 1.4], [0.6, 1], [0.1, 1.2], [0.05, 1.7], [0.5, 2], [0.95, 1.6], [0.9, 0.6], [0.5, 0], [0.1, 0.1]]],
  A: [[[0, 0], [0.5, 2], [1, 0]], [[0.22, 0.8], [0.78, 0.8]]],
  B: [[[0, 0], [0, 2], [0.7, 2], [0.95, 1.7], [0.7, 1.05], [0, 1.05]], [[0.7, 1.05], [1, 0.6], [0.75, 0], [0, 0]]],
  C: [circulo(0.55, 1, 0.5, 1, 18, Math.PI * 0.25, Math.PI * 1.75)],
  E: [[[1, 2], [0, 2], [0, 0], [1, 0]], [[0, 1], [0.75, 1]]],
  U: [[[0, 2], [0, 0.5], [0.5, 0], [1, 0.5], [1, 2]]],
  L: [[[0, 2], [0, 0], [1, 0]]],
};

export function textoEmTracos(texto, escala = 1, espaco = 0.45) {
  const tracos = [];
  let x = 0;
  for (const ch of texto) {
    const g = GLIFOS[ch];
    if (g) for (const t of g) tracos.push(t.map(([px, py]) => [x + px * escala, py * escala]));
    x += (1 + espaco) * escala;
  }
  return { tracos, largura: x - espaco * escala };
}
