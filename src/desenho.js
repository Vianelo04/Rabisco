// A mecânica central: o jogador desenha com o mouse e o traço vira plataforma.
// Visual: tubo 3D (MeshBuilder.CreateTube). Colisão: um corpo estático Havok
// formado por caixinhas finas ao longo do traço (PhysicsShapeContainer).
import {
  MeshBuilder,
  Mesh,
  Vector3,
  Matrix,
  Quaternion,
  StandardMaterial,
  Color3,
  TransformNode,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeBox,
  PhysicsShapeContainer,
  PointerEventTypes,
} from "@babylonjs/core";

const CUSTO_POR_UNIDADE = 4; // tinta gasta por unidade de comprimento
const PASSO_MINIMO = 0.18; // distância mínima entre pontos do traço
const PASSO_MAXIMO = 0.45; // segmentos maiores são subdivididos
const RAIO = 0.075;
const ESPESSURA_COLISAO = 0.26;
const EIXO_Z = new Vector3(0, 0, 1);

export class Desenho {
  /**
   * @param {object} ctx { jogo, hud, audio, efeitos, sombras, podeDesenhar(), posJogador() }
   */
  constructor(scene, camera, ctx) {
    this.scene = scene;
    this.camera = camera;
    this.ctx = ctx;
    this.tracos = [];
    this.atual = null;

    const azul = Color3.FromHexString("#1d3c8f");
    this.matTinta = new StandardMaterial("matTraco", scene);
    this.matTinta.diffuseColor = azul;
    this.matTinta.emissiveColor = azul.scale(0.55);
    this.matTinta.specularColor = new Color3(0.25, 0.25, 0.3);
    this.matEco = new StandardMaterial("matTracoEco", scene);
    this.matEco.diffuseColor = azul;
    this.matEco.emissiveColor = azul.scale(0.7);
    this.matEco.alpha = 0.4;
    this.matEco.specularColor = Color3.Black();

    scene.onPointerObservable.add((info) => {
      const botao = info.event.button;
      switch (info.type) {
        case PointerEventTypes.POINTERDOWN:
          if (botao === 0) this.comecar();
          else if (botao === 2) this.desfazer();
          break;
        case PointerEventTypes.POINTERMOVE:
          if (this.atual) this.continuar();
          break;
        case PointerEventTypes.POINTERUP:
          if (botao === 0) this.terminar();
          break;
      }
    });
  }

  /** Converte a posição do mouse em um ponto no plano do jogo (z = 0). */
  _pontoDoMouse() {
    const raio = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, Matrix.Identity(), this.camera);
    const t = -raio.origin.z / raio.direction.z;
    const p = raio.origin.add(raio.direction.scale(t));
    p.z = 0;
    return p;
  }

  comecar() {
    if (!this.ctx.podeDesenhar() || this.atual) return;
    if (this.ctx.jogo.tinta <= 0.5) {
      this.ctx.hud.aviso("sem tinta!");
      this.ctx.audio.erro();
      return;
    }
    const p = this._pontoDoMouse();
    this.atual = { pontos: [p], visual: [this._tremer(p)], comprimento: 0, malhas: [] };
    this.ctx.audio.riscar(true);
  }

  /** Pequeno tremido "de mão" só no visual. */
  _tremer(p) {
    return new Vector3(p.x + (Math.random() - 0.5) * 0.05, p.y + (Math.random() - 0.5) * 0.05, 0);
  }

  continuar() {
    const tr = this.atual;
    const alvo = this._pontoDoMouse();
    let ultimo = tr.pontos[tr.pontos.length - 1];
    let dist = Vector3.Distance(ultimo, alvo);
    if (dist < PASSO_MINIMO) return;

    const partes = Math.ceil(dist / PASSO_MAXIMO);
    let adicionou = false;
    for (let i = 1; i <= partes; i++) {
      const p = Vector3.Lerp(ultimo, alvo, i / partes);
      const d = Vector3.Distance(tr.pontos[tr.pontos.length - 1], p);
      const custo = d * CUSTO_POR_UNIDADE;
      if (this.ctx.jogo.tinta < custo) {
        this.ctx.hud.aviso("sem tinta!");
        this.ctx.audio.erro();
        this._redesenhar();
        this.terminar();
        return;
      }
      this.ctx.jogo.tinta -= custo;
      tr.pontos.push(p);
      tr.visual.push(this._tremer(p));
      tr.comprimento += d;
      adicionou = true;
    }
    if (adicionou) this._redesenhar();
  }

  _redesenhar() {
    const tr = this.atual;
    tr.malhas.forEach((m) => m.dispose());
    tr.malhas = [];
    if (tr.visual.length < 2) return;
    const principal = MeshBuilder.CreateTube(
      "traco",
      { path: tr.visual, radius: RAIO, tessellation: 7, cap: Mesh.CAP_ALL },
      this.scene
    );
    principal.material = this.matTinta;
    // segundo traço levemente deslocado: aparência de rabisco "passado duas vezes"
    const eco = MeshBuilder.CreateTube(
      "tracoEco",
      { path: tr.visual.map((p) => new Vector3(p.x + 0.05, p.y - 0.04, -0.05)), radius: RAIO * 0.6, tessellation: 5 },
      this.scene
    );
    eco.material = this.matEco;
    tr.malhas.push(principal, eco);
  }

  terminar() {
    const tr = this.atual;
    if (!tr) return;
    this.atual = null;
    this.ctx.audio.riscar(false);

    if (tr.pontos.length < 2 || tr.comprimento < 0.4) {
      this.ctx.jogo.tinta += tr.comprimento * CUSTO_POR_UNIDADE; // traço curto demais: devolve a tinta
      tr.malhas.forEach((m) => m.dispose());
      return;
    }

    // ---- colisão: uma caixa fina por segmento, todas num único corpo estático ----
    const no = new TransformNode("tracoFisico", this.scene);
    const forma = new PhysicsShapeContainer(this.scene);
    const filhos = [];
    for (let i = 0; i < tr.pontos.length - 1; i++) {
      const a = tr.pontos[i];
      const b = tr.pontos[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const comp = Math.hypot(dx, dy);
      if (comp < 0.001) continue;
      const caixa = new PhysicsShapeBox(
        Vector3.Zero(),
        Quaternion.Identity(),
        new Vector3(comp + 0.08, ESPESSURA_COLISAO, 1.6),
        this.scene
      );
      caixa.filterMembershipMask = 1;
      forma.addChild(caixa, new Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, 0), Quaternion.RotationAxis(EIXO_Z, Math.atan2(dy, dx)));
      filhos.push(caixa);
    }
    forma.filterMembershipMask = 1;
    const corpo = new PhysicsBody(no, PhysicsMotionType.STATIC, false, this.scene);
    corpo.shape = forma;

    tr.malhas.forEach((m) => this.ctx.sombras.addShadowCaster(m));
    Object.assign(tr, { no, corpo, forma, filhos });
    this.tracos.push(tr);
    this.ctx.audio.traco();

  }

  /** Remove um traço (usado pela borracha e pelo desfazer). */
  apagar(tr, silencioso = false) {
    const i = this.tracos.indexOf(tr);
    if (i < 0) return;
    this.tracos.splice(i, 1);
    if (!silencioso) {
      this.ctx.efeitos.farelos(tr.pontos[Math.floor(tr.pontos.length / 2)]);
      this.ctx.audio.apagar();
    }
    tr.malhas.forEach((m) => {
      this.ctx.sombras.removeShadowCaster(m);
      m.dispose();
    });
    tr.corpo.dispose();
    tr.filhos.forEach((f) => f.dispose());
    tr.forma.dispose();
    tr.no.dispose();
  }

  desfazer() {
    if (this.atual || !this.ctx.podeDesenhar()) return;
    const tr = this.tracos[this.tracos.length - 1];
    if (!tr) return;
    const j = this.ctx.jogo;
    j.tinta = Math.min(j.tintaMax, j.tinta + tr.comprimento * CUSTO_POR_UNIDADE * (this.ctx.reembolsoDesfazer ?? 0.5));
    this.apagar(tr);
  }

  /** Cancela o traço em andamento (sem criar plataforma). */
  cancelar() {
    if (!this.atual) return;
    this.ctx.jogo.tinta += this.atual.comprimento * CUSTO_POR_UNIDADE;
    this.atual.malhas.forEach((m) => m.dispose());
    this.atual = null;
    this.ctx.audio.riscar(false);
  }

  limpar() {
    this.cancelar();
    [...this.tracos].forEach((t) => this.apagar(t, true));
  }
}
