// Obstáculos da fase:
// - Tachinhas: espetadas de ponta para cima no chão (encostar = perder vida).
// - Bolas de papel: lançadas periodicamente, rolam com física Havok de verdade.
//   Elas batem nos seus rabiscos, então dá para desenhar uma barreira para segurá-las.
import {
  MeshBuilder,
  Vector3,
  Color3,
  StandardMaterial,
  PhysicsAggregate,
  PhysicsShapeType,
  VertexBuffer,
} from "@babylonjs/core";

const MASCARA_BOLA = 4;

function material(scene, nome, hex, emissao, especular = 0) {
  const m = new StandardMaterial(nome, scene);
  m.diffuseColor = Color3.FromHexString(hex);
  m.emissiveColor = Color3.FromHexString(hex).scale(emissao);
  m.specularColor = new Color3(especular, especular, especular);
  return m;
}

export class Obstaculos {
  /**
   * @param {{tachinhas: {x:number,y:number}[], lancadores: {x:number,y:number,intervalo:number,vel:number}[]}} defs
   */
  constructor(scene, sombras, defs) {
    this.scene = scene;
    this.sombras = sombras;
    this.bolas = [];
    this.tachinhas = [];
    this.lancadores = defs.lancadores.map((l) => ({ ...l, tempo: l.intervalo * 0.5 }));

    // ---------- tachinhas (ou gizes de cera em pé, na fase de Desenhos) ----------
    this.estilo = { tachinha: "tachinha", bola: "papel", ...(defs.estilo ?? {}) };
    const cores = ["#e06666", "#e8b931", "#5aa469", "#3a7bd5", "#e056a0"];
    const matPino = material(scene, "matPino", "#b9bec6", 0.2, 0.9);
    defs.tachinhas.forEach((d, i) => {
      const cor = cores[i % cores.length];
      let base;
      if (this.estilo.tachinha === "giz") {
        base = MeshBuilder.CreateCylinder("giz", { height: 0.7, diameter: 0.32, tessellation: 12 }, scene);
        base.position.set(d.x, d.y + 0.35, 0);
        base.material = material(scene, "matGiz" + i, cor, 0.5);
        const ponta = MeshBuilder.CreateCylinder("pontaGiz", { height: 0.35, diameterTop: 0, diameterBottom: 0.32, tessellation: 12 }, scene);
        ponta.position.y = 0.52;
        ponta.material = base.material;
        ponta.parent = base;
        const rotulo = MeshBuilder.CreateCylinder("rotuloGiz", { height: 0.4, diameter: 0.34, tessellation: 12 }, scene);
        rotulo.position.y = -0.05;
        rotulo.material = material(scene, "matRotuloGiz", "#fdfbf4", 0.5);
        rotulo.parent = base;
      } else {
        base = MeshBuilder.CreateCylinder("tachinha", { height: 0.18, diameter: 0.75, tessellation: 20 }, scene);
        base.position.set(d.x, d.y + 0.09, 0);
        base.material = material(scene, "matTachinha" + i, cor, 0.45, 0.4);
        const pino = MeshBuilder.CreateCylinder("pino", { height: 0.6, diameterTop: 0, diameterBottom: 0.12, tessellation: 10 }, scene);
        pino.position.y = 0.38;
        pino.material = matPino;
        pino.parent = base;
      }
      base.renderOutline = true;
      base.outlineColor = new Color3(0.14, 0.14, 0.14);
      base.outlineWidth = 0.03;
      sombras.addShadowCaster(base, true);
      this.tachinhas.push({ x: d.x, y: d.y });
    });

    this.matBola = material(scene, "matBola", "#f7f3e6", 0.4);
  }

  _criarBola(x, y, vel) {
    const s = this.scene;
    const malha = this.estilo.bola === "zero" ? this._malhaZero() : this._malhaPapel();
    malha.position.set(x, y, 0);
    this.sombras.addShadowCaster(malha);

    const agg = new PhysicsAggregate(malha, PhysicsShapeType.SPHERE, { mass: 0.6, friction: 0.5, restitution: 0.35, radius: 0.42 }, s);
    agg.shape.filterMembershipMask = MASCARA_BOLA;
    agg.body.setLinearVelocity(new Vector3(vel, 0, 0));
    agg.body.setAngularVelocity(new Vector3(0, 0, -vel * 2));
    this.bolas.push({ malha, agg, idade: 0 });
  }

  /** Um "0" desenhado a caneta, rolando como uma roda. */
  _malhaZero() {
    const s = this.scene;
    const malha = MeshBuilder.CreateTorus("zero", { diameter: 0.78, thickness: 0.16, tessellation: 24 }, s);
    malha.rotation.x = Math.PI / 2;
    malha.bakeCurrentTransformIntoVertices();
    malha.scaling.y = 1.25;
    malha.bakeCurrentTransformIntoVertices();
    this.matZero ??= material(s, "matZero", "#d64545", 0.6);
    malha.material = this.matZero;
    return malha;
  }

  _malhaPapel() {
    const s = this.scene;
    const malha = MeshBuilder.CreateIcoSphere("bolaPapel", { radius: 0.45, subdivisions: 2, flat: true, updatable: true }, s);
    // amassa o papel: desloca cada vértice (vértices na mesma posição recebem o mesmo deslocamento)
    const pos = malha.getVerticesData(VertexBuffer.PositionKind);
    const deslocamentos = new Map();
    for (let i = 0; i < pos.length; i += 3) {
      const chave = `${pos[i].toFixed(3)},${pos[i + 1].toFixed(3)},${pos[i + 2].toFixed(3)}`;
      if (!deslocamentos.has(chave)) deslocamentos.set(chave, 0.78 + Math.random() * 0.35);
      const k = deslocamentos.get(chave);
      pos[i] *= k;
      pos[i + 1] *= k;
      pos[i + 2] *= k;
    }
    malha.updateVerticesData(VertexBuffer.PositionKind, pos);
    malha.createNormals(false);
    malha.material = this.matBola;
    malha.renderOutline = true;
    malha.outlineColor = new Color3(0.3, 0.3, 0.3);
    malha.outlineWidth = 0.02;
    return malha;
  }

  _removerBola(b) {
    this.sombras.removeShadowCaster(b.malha);
    b.agg.dispose();
    b.malha.dispose();
  }

  limpar() {
    this.bolas.forEach((b) => this._removerBola(b));
    this.bolas = [];
    this.lancadores.forEach((l) => (l.tempo = l.intervalo * 0.5));
  }

  atualizar(dt, jogador, derrotarJogador) {
    const p = jogador.posicao;

    // lançadores só funcionam quando o jogador está se aproximando (à esquerda, perto)
    for (const l of this.lancadores) {
      const dx = l.x - p.x;
      if (dx < 1 || dx > 26) continue;
      l.tempo -= dt;
      if (l.tempo <= 0 && this.bolas.length < 8) {
        l.tempo = l.intervalo;
        this._criarBola(l.x, l.y, l.vel);
      }
    }

    const v = new Vector3();
    for (const b of [...this.bolas]) {
      b.idade += dt;
      const bp = b.malha.position;
      // mantém a bola no plano do jogo
      b.agg.body.getLinearVelocityToRef(v);
      if (Math.abs(bp.z) > 0.02 || Math.abs(v.z) > 0.01) {
        v.z = -bp.z * 6;
        b.agg.body.setLinearVelocity(v);
      }
      if (bp.y < -12 || b.idade > 14) {
        this._removerBola(b);
        this.bolas.splice(this.bolas.indexOf(b), 1);
        continue;
      }
      if (!jogador.morto && Vector3.Distance(bp, p) < 0.95 && Math.abs(bp.y - p.y) < 1.1) derrotarJogador();
    }

    if (!jogador.morto) {
      const pes = p.y - 0.8;
      for (const t of this.tachinhas) {
        const altura = this.estilo.tachinha === "giz" ? 0.95 : 0.55;
        if (Math.abs(p.x - t.x) < 0.5 && pes - t.y < altura && pes - t.y > -0.3) {
          derrotarJogador();
          break;
        }
      }
    }
  }
}
