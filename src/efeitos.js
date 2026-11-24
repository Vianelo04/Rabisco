import { ParticleSystem, DynamicTexture, Vector3, Color4 } from "@babylonjs/core";

export class Efeitos {
  constructor(scene) {
    this.scene = scene;
    this.textura = new DynamicTexture("particula", 64, scene, false);
    const ctx = this.textura.getContext();
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.6, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    this.textura.hasAlpha = true;
    this.textura.update();
  }

  _explosao(pos, { quantidade, cor1, cor2, tamanho = [0.08, 0.2], vida = [0.3, 0.7], forca = [2, 5], gravidade = -12, caixa = 0.2 }) {
    const ps = new ParticleSystem("efeito", quantidade, this.scene);
    ps.particleTexture = this.textura;
    ps.emitter = pos.clone();
    ps.minEmitBox = new Vector3(-caixa, -caixa, -0.1);
    ps.maxEmitBox = new Vector3(caixa, caixa, 0.1);
    ps.color1 = cor1;
    ps.color2 = cor2;
    ps.colorDead = new Color4(cor2.r, cor2.g, cor2.b, 0);
    ps.minSize = tamanho[0];
    ps.maxSize = tamanho[1];
    ps.minLifeTime = vida[0];
    ps.maxLifeTime = vida[1];
    ps.minEmitPower = forca[0];
    ps.maxEmitPower = forca[1];
    ps.direction1 = new Vector3(-1, 1.2, -0.3);
    ps.direction2 = new Vector3(1, 0.2, 0.3);
    ps.gravity = new Vector3(0, gravidade, 0);
    ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    ps.emitRate = 0;
    ps.manualEmitCount = quantidade;
    ps.targetStopDuration = vida[1];
    ps.disposeOnStop = true;
    ps.start();
  }

  farelos(pos) {
    this._explosao(pos, {
      quantidade: 40,
      cor1: new Color4(0.96, 0.62, 0.72, 1),
      cor2: new Color4(0.11, 0.24, 0.56, 1),
      tamanho: [0.06, 0.16],
      caixa: 0.5,
    });
  }

  puf(pos) {
    this._explosao(pos, {
      quantidade: 60,
      cor1: new Color4(0.17, 0.17, 0.17, 1),
      cor2: new Color4(0.5, 0.5, 0.5, 1),
      tamanho: [0.1, 0.35],
      forca: [3, 7],
      gravidade: -4,
      caixa: 0.4,
    });
  }

  brilho(pos) {
    this._explosao(pos, {
      quantidade: 35,
      cor1: new Color4(0.25, 0.5, 1, 1),
      cor2: new Color4(1, 0.95, 0.6, 1),
      tamanho: [0.08, 0.22],
      forca: [2, 4],
      gravidade: 2,
    });
  }

  poeira(pos) {
    this._explosao(pos, {
      quantidade: 12,
      cor1: new Color4(0.6, 0.57, 0.5, 0.8),
      cor2: new Color4(0.8, 0.78, 0.72, 0.6),
      tamanho: [0.08, 0.18],
      vida: [0.2, 0.4],
      forca: [1, 2],
      gravidade: -2,
      caixa: 0.25,
    });
  }
}
