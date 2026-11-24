import {
  MeshBuilder,
  Vector3,
  Color3,
  Color4,
  TransformNode,
  StandardMaterial,
  ParticleSystem,
} from "@babylonjs/core";

const LARGURA = 2.3;
const ALTURA = 2.5;
const DISTANCIA_CONFORTAVEL = 11;
const ELASTICO = 0.55;
const VEL_MAX = 11;

function material(scene, nome, hex, emissao) {
  const m = new StandardMaterial(nome, scene);
  m.diffuseColor = Color3.FromHexString(hex);
  m.emissiveColor = Color3.FromHexString(hex).scale(emissao);
  m.specularColor = Color3.Black();
  return m;
}

export class Borracha {
  constructor(scene, sombras, texturaParticula, velBase = 4.6) {
    this.velBase = velBase;
    this.raiz = new TransformNode("borracha", scene);
    const corpoNo = new TransformNode("borrachaCorpo", scene);
    corpoNo.parent = this.raiz;
    this.corpoNo = corpoNo;
    const contorno = new Color3(0.14, 0.14, 0.14);

    const corpo = MeshBuilder.CreateBox("borrachaCorpo", { width: LARGURA, height: ALTURA, depth: 1.4 }, scene);
    corpo.material = material(scene, "matBorracha", "#f4a7b9", 0.35);
    const capa = MeshBuilder.CreateBox("borrachaCapa", { width: 1.0, height: ALTURA + 0.16, depth: 1.56 }, scene);
    capa.position.x = -LARGURA / 2 + 0.45;
    capa.material = material(scene, "matCapa", "#4f7cc4", 0.3);
    for (const m of [corpo, capa]) {
      m.renderOutline = true;
      m.outlineColor = contorno;
      m.outlineWidth = 0.04;
      m.parent = corpoNo;
      sombras.addShadowCaster(m);
    }

    const branco = material(scene, "matOlhoB", "#ffffff", 0.9);
    const preto = material(scene, "matPupila", "#222222", 0.1);
    for (const x of [0.35, 0.85]) {
      const olho = MeshBuilder.CreateSphere("olhoB", { diameter: 0.42, segments: 10 }, scene);
      olho.position.set(x, 0.35, -0.72);
      olho.scaling.z = 0.4;
      olho.material = branco;
      olho.parent = corpoNo;
      const pupila = MeshBuilder.CreateSphere("pupila", { diameter: 0.17, segments: 8 }, scene);
      pupila.position.set(x + 0.08, 0.32, -0.81);
      pupila.material = preto;
      pupila.parent = corpoNo;
      const sobrancelha = MeshBuilder.CreateBox("sobrancelha", { width: 0.42, height: 0.08, depth: 0.05 }, scene);
      sobrancelha.position.set(x, 0.66, -0.78);
      sobrancelha.rotation.z = x < 0.6 ? -0.35 : 0.35;
      sobrancelha.material = preto;
      sobrancelha.parent = corpoNo;
    }
    const boca = MeshBuilder.CreateBox("boca", { width: 0.6, height: 0.09, depth: 0.05 }, scene);
    boca.position.set(0.6, -0.25, -0.73);
    boca.rotation.z = 0.12;
    boca.material = preto;
    boca.parent = corpoNo;

    const farelos = new ParticleSystem("farelosBorracha", 300, scene);
    farelos.particleTexture = texturaParticula;
    farelos.emitter = this.raiz;
    farelos.minEmitBox = new Vector3(-LARGURA / 2, -ALTURA / 2, -0.3);
    farelos.maxEmitBox = new Vector3(-LARGURA / 2 + 0.2, ALTURA / 2, 0.3);
    farelos.color1 = new Color4(0.96, 0.62, 0.72, 1);
    farelos.color2 = new Color4(0.85, 0.5, 0.6, 1);
    farelos.colorDead = new Color4(0.85, 0.5, 0.6, 0);
    farelos.minSize = 0.06;
    farelos.maxSize = 0.16;
    farelos.minLifeTime = 0.4;
    farelos.maxLifeTime = 0.9;
    farelos.emitRate = 70;
    farelos.direction1 = new Vector3(-1, 0.5, 0);
    farelos.direction2 = new Vector3(-0.3, 1.5, 0);
    farelos.minEmitPower = 1;
    farelos.maxEmitPower = 3;
    farelos.gravity = new Vector3(0, -9, 0);
    farelos.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    this.farelos = farelos;

    this.x = 0;
    this.y = 0;
    this.t = 0;
    this.espera = 0;
    this.ativa = false;
    this.raiz.setEnabled(false);
  }

  resetar(posJogador, espera) {
    this.x = posJogador.x - DISTANCIA_CONFORTAVEL - 2;
    this.y = posJogador.y + 0.4;
    this.espera = espera;
    this.ativa = false;
    this.raiz.setEnabled(false);
    this.farelos.stop();
  }

  parar() {
    this.ativa = false;
    this.espera = Infinity;
    this.farelos.stop();
  }

  distancia(jogador) {
    return jogador.posicao.x - this.x;
  }

  atualizar(dt, jogador, desenho, derrotarJogador) {
    let acordou = false;
    if (!this.ativa) {
      this.espera -= dt;
      if (this.espera > 0) return false;
      this.ativa = true;
      acordou = true;
      this.raiz.setEnabled(true);
      this.farelos.start();
    }
    this.t += dt;

    const p = jogador.posicao;
    const atras = p.x - this.x;
    const vel = Math.min(VEL_MAX, this.velBase + Math.max(0, atras - DISTANCIA_CONFORTAVEL) * ELASTICO);
    this.x += vel * dt;
    const alvoY = Math.max(p.y + 0.4, 1);
    this.y += (alvoY - this.y) * Math.min(1, dt * 2.5);

    const esfrega = Math.sin(this.t * 14);
    this.raiz.position.set(this.x, this.y + Math.abs(esfrega) * 0.15, 0);
    this.corpoNo.rotation.z = esfrega * 0.08;

    for (const tr of [...desenho.tracos]) {
      if (tr.pontos.some((q) => q.x < this.x + LARGURA / 2 + 0.1 && q.x > this.x - LARGURA && Math.abs(q.y - this.y) < ALTURA / 2 + 0.6)) {
        desenho.apagar(tr);
      }
    }

    if (!jogador.morto && Math.abs(p.x - this.x) < LARGURA / 2 + 0.25 && Math.abs(p.y - this.y) < ALTURA / 2 + 0.7) {
      derrotarJogador();
    }
    return acordou;
  }
}
