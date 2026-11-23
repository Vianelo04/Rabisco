import {
  MeshBuilder,
  Mesh,
  Vector3,
  Vector4,
  TransformNode,
  PhysicsAggregate,
  PhysicsShapeType,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import {
  texturaPautada,
  texturaQuadriculada,
  texturaLisa,
  materialPapel,
  materialTinta,
  materialDeCanvas,
  desenharTexto,
  desenharRasgo,
  desenharDoodle,
  CORES,
  TAMANHO_AZULEJO,
} from "../cena/papel.js";

const FUNDO_DO_MUNDO = -16;
const PROFUNDIDADE = 2.2;

const TEXTURAS_DE_PAPEL = { pautada: texturaPautada, quadriculada: texturaQuadriculada, lisa: texturaLisa };

export function construirFase(def, ctx) {
  const { scene, sombras, brilho } = ctx;
  const raiz = new TransformNode("fase-" + def.id, scene);
  ctx.raiz = raiz;

  const chaos = def.chaos;
  const xMin = Math.min(...chaos.map((c) => c.x0)) - 4;
  const xMax = Math.max(...chaos.map((c) => c.x1)) + 4;

  const larguraFolha = xMax - xMin;
  const alturaFolha = 44;
  const folha = MeshBuilder.CreatePlane("folha", { width: larguraFolha, height: alturaFolha }, scene);
  folha.position.set((xMin + xMax) / 2, 4, 1.3);
  folha.material = materialPapel(
    scene,
    "matFolha",
    (TEXTURAS_DE_PAPEL[def.papel] ?? texturaPautada)(scene),
    larguraFolha / TAMANHO_AZULEJO,
    alturaFolha / TAMANHO_AZULEJO
  );
  folha.receiveShadows = true;
  folha.parent = raiz;

  if (def.papel !== "lisa") {
    const margem = MeshBuilder.CreatePlane("margem", { width: 0.09, height: alturaFolha }, scene);
    margem.position.set(chaos[0].x1 + 2.5, 4, 1.28);
    margem.material = materialTinta(scene, "matMargem", CORES.margem, 1);
    margem.parent = raiz;
  }

  const solidos = chaos.filter((c) => !c.flutuante).sort((a, b) => a.x0 - b.x0);
  for (let i = 0; i < solidos.length - 1; i++) {
    const a = solidos[i];
    const b = solidos[i + 1];
    if (b.x0 - a.x1 < 0.05) continue;
    if ((def.semRasgo ?? []).some(([x0, x1]) => x0 <= a.x1 + 0.01 && x1 >= b.x0 - 0.01)) continue;
    const topo = Math.min(a.topo, b.topo);
    const largura = b.x0 - a.x1 + 0.8;
    const altura = topo - FUNDO_DO_MUNDO + 0.6;
    const plano = MeshBuilder.CreatePlane("rasgo", { width: largura, height: altura }, scene);
    plano.position.set((a.x1 + b.x0) / 2, FUNDO_DO_MUNDO + altura / 2, 1.25);
    plano.material = materialDeCanvas(scene, "matRasgo", 512, Math.min(2048, Math.round((512 * altura) / largura)), desenharRasgo);
    plano.parent = raiz;
  }

  const corChao = def.corChao ?? "#f3ecd8";
  const matChao = new StandardMaterial("matChao", scene);
  matChao.diffuseTexture = def.papel === "quadriculada" ? texturaPautada(scene) : texturaQuadriculada(scene);
  matChao.diffuseColor = Color3.FromHexString(corChao);
  matChao.specularColor = Color3.Black();
  matChao.emissiveColor = new Color3(0.15, 0.14, 0.12);

  for (const c of chaos) {
    const largura = c.x1 - c.x0;
    const altura = c.flutuante ? 0.8 : c.topo - FUNDO_DO_MUNDO;
    const t = TAMANHO_AZULEJO / 2;
    const uvFrente = new Vector4(0, 0, largura / t, altura / t);
    const uvLado = new Vector4(0, 0, PROFUNDIDADE / t, altura / t);
    const uvTopo = new Vector4(0, 0, largura / t, PROFUNDIDADE / t);
    const bloco = MeshBuilder.CreateBox(
      "chao",
      { width: largura, height: altura, depth: PROFUNDIDADE, faceUV: [uvFrente, uvFrente, uvLado, uvLado, uvTopo, uvTopo], wrap: true },
      scene
    );
    bloco.position.set((c.x0 + c.x1) / 2, c.topo - altura / 2, 0);
    if (c.cor) {
      const m = matChao.clone("matChao" + c.cor);
      m.diffuseColor = Color3.FromHexString(c.cor);
      bloco.material = m;
    } else bloco.material = matChao;
    bloco.receiveShadows = true;
    bloco.renderOutline = true;
    bloco.outlineColor = Color3.FromHexString(CORES.grafite);
    bloco.outlineWidth = 0.06;
    bloco.parent = raiz;
    sombras.addShadowCaster(bloco);
    const agg = new PhysicsAggregate(bloco, PhysicsShapeType.BOX, { mass: 0, friction: 0, restitution: 0 }, scene);
    agg.shape.filterMembershipMask = 1;
  }

  for (const a of def.anotacoes ?? []) {
    const tam = a.tam ?? 92;
    const escala = tam / 92;
    const plano = MeshBuilder.CreatePlane("anotacao", { width: 6.4 * escala * (a.largura ?? 1), height: 1.6 * escala * a.linhas.length }, scene);
    plano.position.set(a.x, a.y, 1.2);
    plano.material = materialDeCanvas(
      scene,
      "matAnotacao",
      Math.round(1024 * (a.largura ?? 1)),
      256 * a.linhas.length,
      desenharTexto(a.linhas, 92, a.cor ?? CORES.grafite)
    );
    plano.parent = raiz;
  }
  for (const d of def.doodles ?? []) {
    const plano = MeshBuilder.CreatePlane("doodle", { size: d.tam }, scene);
    plano.position.set(d.x, d.y, d.z ?? 1.22);
    plano.material = materialDeCanvas(scene, "matDoodle", 256, 256, desenharDoodle(d.tipo, d.cor));
    plano.parent = raiz;
  }

  const matClipe = new StandardMaterial("matClipe", scene);
  matClipe.diffuseColor = new Color3(0.62, 0.65, 0.7);
  matClipe.specularColor = new Color3(0.9, 0.9, 0.9);
  matClipe.specularPower = 32;
  const matClipeAtivo = materialTinta(scene, "matClipeAtivo", "#e8b931", 0.55);
  matClipeAtivo.specularColor = new Color3(1, 1, 0.8);

  const checkpoints = def.checkpoints.map(([x, topo]) => {
    const malha = MeshBuilder.CreateTube("clipe", { path: caminhoClipe(), radius: 0.055, tessellation: 8 }, scene);
    malha.position.set(x, topo + 0.95, -0.2);
    malha.rotation.z = -0.25;
    malha.material = matClipe;
    malha.parent = raiz;
    sombras.addShadowCaster(malha);
    return {
      posicao: new Vector3(x, topo + 1.2, 0),
      malha,
      ativo: false,
      ativar() {
        this.ativo = true;
        malha.material = matClipeAtivo;
      },
      resetar() {
        this.ativo = false;
        malha.material = matClipe;
        malha.rotation.y = 0;
      },
    };
  });

  const matVidro = new StandardMaterial("matVidro", scene);
  matVidro.diffuseColor = new Color3(0.85, 0.92, 1);
  matVidro.alpha = 0.35;
  matVidro.specularColor = Color3.White();
  const matTintaFrasco = materialTinta(scene, "matTintaFrasco", "#2d5fd8", 0.8);
  const matRolha = materialTinta(scene, "matRolha", "#a8774a", 0.3);

  const frascos = def.frascos.map(([x, y]) => {
    const no = new TransformNode("frasco", scene);
    no.position.set(x, y, 0);
    no.parent = raiz;
    const vidro = MeshBuilder.CreateCylinder("vidro", { height: 0.7, diameter: 0.55, tessellation: 16 }, scene);
    vidro.material = matVidro;
    vidro.parent = no;
    const liquido = MeshBuilder.CreateCylinder("liquido", { height: 0.45, diameter: 0.46, tessellation: 16 }, scene);
    liquido.position.y = -0.1;
    liquido.material = matTintaFrasco;
    liquido.parent = no;
    const rolha = MeshBuilder.CreateCylinder("rolha", { height: 0.2, diameter: 0.26, tessellation: 10 }, scene);
    rolha.position.y = 0.45;
    rolha.material = matRolha;
    rolha.parent = no;
    sombras.addShadowCaster(vidro);
    brilho.addIncludedOnlyMesh(liquido);
    return {
      posicao: new Vector3(x, y, 0),
      no,
      quantidade: 0,
      coletado: false,
      garantido: false,
      resetar() {
        this.coletado = false;
        this.garantido = false;
        no.setEnabled(this.quantidade > 0);
      },
    };
  });

  const [sx, sy] = def.saida;
  const saida = new TransformNode("saida", scene);
  saida.position.set(sx, sy + 0.4, 0);
  saida.parent = raiz;
  const orelha = MeshBuilder.CreateDisc("orelha", { radius: 1.3, tessellation: 3, sideOrientation: Mesh.DOUBLESIDE }, scene);
  orelha.rotation.z = Math.PI / 4;
  orelha.material = materialTinta(scene, "matOrelha", "#fff6c9", 0.9);
  orelha.renderOutline = true;
  orelha.outlineColor = Color3.FromHexString(CORES.grafite);
  orelha.outlineWidth = 0.05;
  orelha.parent = saida;
  brilho.addIncludedOnlyMesh(orelha);

  const especiais = def.especiais ? def.especiais(scene, ctx) : [];

  return {
    def,
    spawn: new Vector3(def.spawn[0], def.spawn[1] + 1.2, 0),
    limiteQueda: def.limiteQueda ?? -7,
    checkpoints,
    frascos,
    especiais,
    saida: { posicao: new Vector3(sx, sy, 0), no: saida },
    obstaculos: { tachinhas: def.tachinhas ?? [], lancadores: def.lancadores ?? [], estilo: def.estiloObstaculos ?? {} },
    animar(t) {
      for (const f of frascos) {
        if (f.coletado) continue;
        f.no.position.y = f.posicao.y + Math.sin(t * 2.5 + f.posicao.x) * 0.15;
        f.no.rotation.y = t * 1.2;
      }
      for (const c of checkpoints) if (c.ativo) c.malha.rotation.y = Math.sin(t * 3) * 0.4;
      saida.rotation.z = Math.sin(t * 2) * 0.12;
      saida.scaling.setAll(1 + Math.sin(t * 4) * 0.05);
    },
    resetar() {
      checkpoints.forEach((c) => c.resetar());
      frascos.forEach((f) => f.resetar());
      especiais.forEach((e) => e.resetar?.());
    },
  };
}

function caminhoClipe() {
  const pts = [];
  const arco = (cx, cy, r, a0, a1, n = 10) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push(new Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
    }
  };
  pts.push(new Vector3(-0.12, -0.25, 0));
  arco(0.0, 0.45, 0.12, Math.PI, 0);
  arco(-0.05, -0.5, 0.17, 0, -Math.PI);
  arco(0.0, 0.6, 0.22, Math.PI, 0);
  pts.push(new Vector3(0.22, -0.35, 0));
  return pts;
}
