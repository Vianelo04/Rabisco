import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
  TransformNode,
  PhysicsAggregate,
  PhysicsShapeType,
  PhysicsRaycastResult,
} from "@babylonjs/core";

const VELOCIDADE = 7;
const ACEL_CHAO = 60;
const ACEL_AR = 32;
const FORCA_PULO = 12.5;
const TEMPO_COYOTE = 0.1;
const BUFFER_PULO = 0.13;
const QUEDA_MAX = 22;
const MEIA_ALTURA = 0.8;

const MASCARA_JOGADOR = 2;
const MASCARA_CENARIO = 1;

function aproximar(atual, alvo, passo) {
  return atual < alvo ? Math.min(atual + passo, alvo) : Math.max(atual - passo, alvo);
}

export class Jogador {
  constructor(scene, entrada, sombras, efeitos, audio) {
    this.scene = scene;
    this.entrada = entrada;
    this.efeitos = efeitos;
    this.audio = audio;

    this.capsula = MeshBuilder.CreateCapsule("jogador", { height: MEIA_ALTURA * 2, radius: 0.35 }, scene);
    this.capsula.isVisible = false;
    this.agg = new PhysicsAggregate(
      this.capsula,
      PhysicsShapeType.CAPSULE,
      { mass: 1, friction: 0, restitution: 0 },
      scene
    );
    this.corpo = this.agg.body;
    this.corpo.setMassProperties({ inertia: Vector3.Zero() });
    this.agg.shape.filterMembershipMask = MASCARA_JOGADOR;

    this.vel = new Vector3();
    this.vx = 0;
    this.olhando = 1;
    this.noChao = false;
    this.tempoNoAr = 0;
    this.coyote = 0;
    this.buffer = 0;
    this.pulando = false;
    this.puloCortado = false;
    this.morto = false;
    this.travado = false;
    this.faseAnimacao = 0;
    this.squash = 1;

    this._raio = new PhysicsRaycastResult();
    this._de = new Vector3();
    this._ate = new Vector3();
    this._normal = new Vector3(0, 1, 0);
    this._velPlataforma = new Vector3();
    this.corpoChao = null;
    this.plataformas = new Map();

    this._montarVisual(sombras);
  }

  get posicao() {
    return this.capsula.position;
  }

  _montarVisual(sombras) {
    const s = this.scene;
    const tinta = new StandardMaterial("matPalito", s);
    tinta.diffuseColor = new Color3(0.14, 0.14, 0.14);
    tinta.emissiveColor = new Color3(0.08, 0.08, 0.08);
    tinta.specularColor = Color3.Black();
    const papel = new StandardMaterial("matCabeca", s);
    papel.diffuseColor = new Color3(1, 0.99, 0.95);
    papel.emissiveColor = new Color3(0.45, 0.44, 0.42);
    papel.specularColor = Color3.Black();
    const vermelho = new StandardMaterial("matCachecol", s);
    vermelho.diffuseColor = Color3.FromHexString("#e06666");
    vermelho.emissiveColor = Color3.FromHexString("#e06666").scale(0.4);
    vermelho.specularColor = Color3.Black();

    const raiz = new TransformNode("visual", s);
    raiz.parent = this.capsula;
    this.raiz = raiz;

    const cabeca = MeshBuilder.CreateSphere("cabeca", { diameter: 0.62, segments: 16 }, s);
    cabeca.position.y = 0.42;
    cabeca.material = papel;
    cabeca.renderOutline = true;
    cabeca.outlineColor = new Color3(0.14, 0.14, 0.14);
    cabeca.outlineWidth = 0.045;
    cabeca.parent = raiz;

    for (const [x, z] of [[0.09, -0.27], [0.22, -0.2]]) {
      const olho = MeshBuilder.CreateSphere("olho", { diameter: 0.09, segments: 6 }, s);
      olho.position.set(x, 0.47, z);
      olho.material = tinta;
      olho.parent = raiz;
    }

    const cachecol = MeshBuilder.CreateTorus("cachecol", { diameter: 0.26, thickness: 0.09, tessellation: 16 }, s);
    cachecol.position.y = 0.12;
    cachecol.material = vermelho;
    cachecol.parent = raiz;
    const ponta = MeshBuilder.CreateBox("pontaCachecol", { width: 0.28, height: 0.08, depth: 0.05 }, s);
    ponta.position.set(-0.22, 0.08, 0);
    ponta.rotation.z = -0.4;
    ponta.material = vermelho;
    ponta.parent = raiz;
    this.pontaCachecol = ponta;

    const tronco = MeshBuilder.CreateCylinder("tronco", { height: 0.55, diameter: 0.075 }, s);
    tronco.position.y = -0.1;
    tronco.material = tinta;
    tronco.parent = raiz;

    const membro = (nome, y, comprimento) => {
      const pivo = new TransformNode(nome, s);
      pivo.position.y = y;
      pivo.parent = raiz;
      const m = MeshBuilder.CreateCylinder(nome + "Malha", { height: comprimento, diameter: 0.07 }, s);
      m.position.y = -comprimento / 2;
      m.material = tinta;
      m.parent = pivo;
      sombras.addShadowCaster(m);
      return pivo;
    };
    this.pernas = [membro("pernaA", -0.37, 0.45), membro("pernaB", -0.37, 0.45)];
    this.bracos = [membro("bracoA", 0.08, 0.4), membro("bracoB", 0.08, 0.4)];

    [cabeca, tronco, cachecol].forEach((m) => sombras.addShadowCaster(m));
  }

  _checarChao(pos) {
    const pe = this.scene.getPhysicsEngine();
    let achou = false;
    let melhorY = -Infinity;
    this.corpoChao = null;
    for (const dx of [-0.26, 0, 0.26]) {
      this._de.set(pos.x + dx, pos.y - 0.4, 0);
      this._ate.set(pos.x + dx, pos.y - MEIA_ALTURA - 0.18, 0);
      pe.raycastToRef(this._de, this._ate, this._raio, {
        membership: MASCARA_JOGADOR,
        collideWith: MASCARA_CENARIO,
        ignoreBody: this.corpo,
      });
      if (this._raio.hasHit && this._raio.hitNormalWorld.y > 0.5 && this._raio.hitPointWorld.y > melhorY) {
        melhorY = this._raio.hitPointWorld.y;
        this._normal.copyFrom(this._raio.hitNormalWorld);
        this.corpoChao = this._raio.body ?? null;
        achou = true;
      }
    }
    return achou;
  }

  _degrauAFrente(pos, direcao) {
    const pe = this.scene.getPhysicsEngine();
    const pes = pos.y - MEIA_ALTURA;
    this._de.set(pos.x + direcao * 0.55, pos.y + 0.1, 0);
    this._ate.set(pos.x + direcao * 0.55, pes - 0.05, 0);
    pe.raycastToRef(this._de, this._ate, this._raio, {
      membership: MASCARA_JOGADOR,
      collideWith: MASCARA_CENARIO,
      ignoreBody: this.corpo,
    });
    if (!this._raio.hasHit || this._raio.hitNormalWorld.y < 0.45) return 0;
    const altura = this._raio.hitPointWorld.y - pes;
    return altura > 0.06 && altura < 0.8 ? altura : 0;
  }

  atualizar(dt) {
    if (this.morto) return;
    const pos = this.posicao;
    const v = this.vel;
    this.corpo.getLinearVelocityToRef(v);

    const estavaNoChao = this.noChao;
    const tocouChao = this._checarChao(pos);
    const plat = tocouChao ? this.plataformas.get(this.corpoChao) : null;
    if (plat) plat.velocidadeEm(pos, this._velPlataforma);
    else this._velPlataforma.set(0, 0, 0);
    this.noChao = tocouChao && v.y - this._velPlataforma.y < 2;
    if (!this.noChao) this.corpoChao = null;

    if (this.noChao) {
      if (!estavaNoChao && this.tempoNoAr > 0.25) {
        this.squash = 0.7;
        this.efeitos.poeira(new Vector3(pos.x, pos.y - MEIA_ALTURA, 0));
        this.audio.pousar();
      }
      this.tempoNoAr = 0;
      this.coyote = TEMPO_COYOTE;
      this.pulando = false;
    } else {
      this.tempoNoAr += dt;
      this.coyote -= dt;
    }

    const eixo = this.travado ? 0 : this.entrada.eixoX;
    if (this.entrada.consumirPulo() && !this.travado) this.buffer = BUFFER_PULO;
    else this.buffer -= dt;
    if (eixo !== 0) this.olhando = eixo;

    const atual = this.noChao ? this.vx : v.x;
    this.vx = aproximar(atual, eixo * VELOCIDADE, (this.noChao ? ACEL_CHAO : ACEL_AR) * dt);

    if (this.buffer > 0 && this.coyote > 0) {
      this.buffer = 0;
      this.coyote = 0;
      this.noChao = false;
      this.pulando = true;
      this.puloCortado = false;
      v.y = FORCA_PULO + Math.max(0, this._velPlataforma.y);
      this.vx += this._velPlataforma.x * 0.5;
      this.squash = 1.3;
      this.audio.pulo();
    }
    if (this.pulando && !this.puloCortado && v.y > 0 && !this.entrada.segurandoPulo) {
      v.y *= 0.5;
      this.puloCortado = true;
    }

    const degrau = this.noChao && Math.abs(this.vx) > 0.5 ? this._degrauAFrente(pos, Math.sign(this.vx)) : 0;
    if (degrau > 0) {
      this.corpo.setGravityFactor(1);
      v.x = this.vx;
      v.y = Math.sqrt(2 * 28 * (degrau + 0.15));
    } else if (this.noChao) {
      this.corpo.setGravityFactor(0);
      const n = this._normal;
      v.x = n.y * this.vx + this._velPlataforma.x;
      v.y = -n.x * this.vx - 1.5 + this._velPlataforma.y;
    } else {
      this.corpo.setGravityFactor(1);
      v.x = this.vx;
      v.y = Math.max(v.y, -QUEDA_MAX);
    }
    v.z = -pos.z * 5;
    this.corpo.setLinearVelocity(v);

    this._animar(dt);
  }

  _animar(dt) {
    const rapidez = Math.min(Math.abs(this.vx) / VELOCIDADE, 1);
    if (this.noChao) {
      this.faseAnimacao += Math.abs(this.vx) * dt * 2.3;
      const ang = Math.sin(this.faseAnimacao) * 0.75 * rapidez;
      this.pernas[0].rotation.z = ang;
      this.pernas[1].rotation.z = -ang;
      this.bracos[0].rotation.z = -ang * 0.8 + 0.3;
      this.bracos[1].rotation.z = ang * 0.8 - 0.3;
    } else {
      const subindo = this.vel.y > 0;
      this.pernas[0].rotation.z = subindo ? 0.6 : 0.35;
      this.pernas[1].rotation.z = subindo ? -0.2 : -0.45;
      this.bracos[0].rotation.z = 2.3;
      this.bracos[1].rotation.z = -2.3;
    }
    this.pontaCachecol.rotation.z = -0.4 - rapidez * 0.5 + Math.sin(this.faseAnimacao * 2) * 0.15;
    this.squash += (1 - this.squash) * Math.min(1, dt * 12);
    const largura = 1 + (1 - this.squash) * 0.6;
    this.raiz.scaling.set(this.olhando * largura, this.squash, 1);
  }

  teleportar(pos) {
    this.corpo.disablePreStep = false;
    this.capsula.position.copyFrom(pos);
    this.corpo.setLinearVelocity(Vector3.Zero());
    this.scene.onAfterPhysicsObservable.addOnce(() => (this.corpo.disablePreStep = true));
  }

  morrer() {
    this.morto = true;
    this.raiz.setEnabled(false);
    this.corpo.setGravityFactor(0);
    this.corpo.setLinearVelocity(Vector3.Zero());
  }

  reviver(pos) {
    this.teleportar(pos);
    this.morto = false;
    this.vx = 0;
    this.squash = 1.4;
    this.raiz.setEnabled(true);
  }

  parar() {
    this.travado = true;
    this.vx = 0;
  }
}
