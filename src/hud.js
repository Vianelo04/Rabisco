// Interface da partida com Babylon GUI: tinta, vidas, tempo, avisos, alerta da borracha,
// tela de pausa e tela de fim (vitória / sem vidas).
import { AdvancedDynamicTexture, Rectangle, TextBlock, Button, StackPanel, Control } from "@babylonjs/gui";
import { CORES } from "./cena/papel.js";
import { formatarTempo } from "./progresso.js";

export const FONTE_GUI = "Patrick Hand";

export function texto(conteudo, tamanho, cor = CORES.grafite) {
  const t = new TextBlock();
  t.text = conteudo;
  t.fontFamily = FONTE_GUI;
  t.fontSize = tamanho;
  t.color = cor;
  t.height = `${Math.round(tamanho * 1.35)}px`;
  t.width = 1;
  return t;
}

export function botao(nome, rotulo, { largura = 300, altura = 70, fundo = "#fff6c9", tamanho = 36 } = {}) {
  const b = Button.CreateSimpleButton(nome, rotulo);
  b.width = `${largura}px`;
  b.height = `${altura}px`;
  b.color = CORES.grafite;
  b.background = fundo;
  b.thickness = 4;
  b.cornerRadius = 14;
  b.fontFamily = FONTE_GUI;
  b.fontSize = tamanho;
  b.paddingTop = "12px";
  b.pointerEnterAnimation = () => (b.scaleX = b.scaleY = 1.06);
  b.pointerOutAnimation = () => (b.scaleX = b.scaleY = 1);
  return b;
}

function painelDeTela(nome, fundo = "rgba(251, 247, 234, 0.9)") {
  const ret = new Rectangle(nome);
  ret.width = 1;
  ret.height = 1;
  ret.thickness = 0;
  ret.background = fundo;
  const pilha = new StackPanel();
  pilha.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  ret.addControl(pilha);
  return { fundo: ret, pilha };
}

export class Hud {
  /**
   * @param {object} info { titulo, dificuldade }
   */
  constructor(scene, info) {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("hud", true, scene);
    this.ui.idealHeight = 900;
    this._tempoAviso = 0;
    this._pulso = 0;

    this._montarJogo(info);
    this._montarPausa();
    this._montarFim();
    this.mostrar("jogo");
  }

  _montarJogo(info) {
    const jogo = new Rectangle("hudJogo");
    jogo.thickness = 0;
    jogo.isPointerBlocker = false;
    this.ui.addControl(jogo);
    this.telaJogo = jogo;

    // barra de tinta (canto superior esquerdo)
    const caixa = new StackPanel();
    caixa.width = "320px";
    caixa.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    caixa.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    caixa.left = "28px";
    caixa.top = "18px";
    jogo.addControl(caixa);
    this.rotuloTinta = texto("tinta", 34);
    this.rotuloTinta.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    caixa.addControl(this.rotuloTinta);
    const barra = new Rectangle("barraTinta");
    barra.width = "300px";
    barra.height = "28px";
    barra.thickness = 4;
    barra.color = CORES.grafite;
    barra.cornerRadius = 10;
    barra.background = "#fbf7ea";
    barra.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    caixa.addControl(barra);
    this.preenchimento = new Rectangle("tinta");
    this.preenchimento.thickness = 0;
    this.preenchimento.background = CORES.tinta;
    this.preenchimento.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.preenchimento.width = 1;
    barra.addControl(this.preenchimento);
    this.barra = barra;

    const canto = (conteudo, tamanho, cor, topo) => {
      const t = texto(conteudo, tamanho, cor);
      t.width = "460px";
      t.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      t.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      t.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      t.left = "-28px";
      t.top = topo;
      jogo.addControl(t);
      return t;
    };
    this.info = canto("", 34, CORES.grafite, "18px");
    this.vidas = canto("", 40, CORES.margem, "62px");
    canto(`${info.titulo} · ${info.dificuldade}`, 26, "#777", "112px");

    // alerta quando a borracha está chegando e ainda fora da tela
    this.alerta = texto("◀ BORRACHA!", 54, CORES.margem);
    this.alerta.width = "360px";
    this.alerta.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.alerta.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.alerta.left = "24px";
    this.alerta.outlineColor = "#fbf7ea";
    this.alerta.outlineWidth = 8;
    this.alerta.isVisible = false;
    jogo.addControl(this.alerta);

    // aviso central
    this.textoAviso = texto("", 64, CORES.tinta);
    this.textoAviso.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textoAviso.top = "150px";
    this.textoAviso.outlineColor = "#fbf7ea";
    this.textoAviso.outlineWidth = 8;
    this.textoAviso.alpha = 0;
    jogo.addControl(this.textoAviso);

    const dica = texto("segure o botão esquerdo para desenhar  ·  Z desfaz  ·  ESC pausa  ·  M som", 26, "#5a5a5a");
    dica.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    dica.top = "-14px";
    jogo.addControl(dica);
  }

  _montarPausa() {
    const { fundo, pilha } = painelDeTela("pausa");
    pilha.addControl(texto("Pausa", 110, CORES.tinta));
    this.botaoContinuar = botao("continuar", "continuar");
    this.botaoReiniciar = botao("reiniciar", "recomeçar fase");
    this.botaoMenuPausa = botao("menuPausa", "voltar ao caderno", { fundo: "#ffffff" });
    [this.botaoContinuar, this.botaoReiniciar, this.botaoMenuPausa].forEach((b) => pilha.addControl(b));
    this.ui.addControl(fundo);
    this.telaPausa = fundo;
  }

  _montarFim() {
    const { fundo, pilha } = painelDeTela("fim");
    this.tituloFim = texto("", 110, CORES.tinta);
    this.subtituloFim = texto("", 38);
    this.resumo = texto("", 40, CORES.grafite);
    this.resumo.paddingTop = "10px";
    this.recordeFim = texto("", 34, "#c98a00");
    this.botaoPrincipal = botao("principal", "");
    this.botaoMenuFim = botao("menuFim", "voltar ao caderno", { fundo: "#ffffff" });
    [this.tituloFim, this.subtituloFim, this.resumo, this.recordeFim, this.botaoPrincipal, this.botaoMenuFim].forEach((c) =>
      pilha.addControl(c)
    );
    this.ui.addControl(fundo);
    this.telaFim = fundo;
  }

  /** @param {"jogo"|"pausa"|"fim"} qual */
  mostrar(qual) {
    this.telaJogo.isVisible = qual === "jogo";
    this.telaPausa.isVisible = qual === "pausa";
    this.telaFim.isVisible = qual === "fim";
    this._aparecerFim = false;
  }

  /**
   * @param {{venceu:boolean, titulo:string, subtitulo:string, resumo:string, recorde?:string, botao:string}} o
   */
  mostrarFim(o) {
    this.telaFim.background = o.venceu ? "rgba(251, 247, 234, 0)" : "rgba(251, 247, 234, 0.88)";
    this.tituloFim.text = o.titulo;
    this.tituloFim.color = o.venceu ? CORES.tinta : CORES.margem;
    this.subtituloFim.text = o.subtitulo;
    this.resumo.text = o.resumo;
    this.recordeFim.text = o.recorde ?? "";
    this.botaoPrincipal.textBlock.text = o.botao;
    this.mostrar("fim");
    this.telaFim.alpha = 0;
    this._aparecerFim = true;
  }

  aviso(msg, duracao = 1.4) {
    this.textoAviso.text = msg;
    this._tempoAviso = duracao;
  }

  /** Pisca "◀ BORRACHA!" na borda esquerda quando ela está perto mas fora da tela. */
  alertarBorracha(visivel) {
    this.alerta.isVisible = visivel;
    if (visivel) this.alerta.alpha = 0.55 + Math.abs(Math.sin(this._pulso * 6)) * 0.45;
  }

  atualizar(jogo, dt) {
    this._pulso += dt;
    const pct = Math.max(0, jogo.tinta / jogo.tintaMax);
    this.preenchimento.width = pct;
    const pouca = pct < 0.25;
    this.preenchimento.background = pouca ? CORES.margem : CORES.tinta;
    this.barra.scaleX = this.barra.scaleY = pouca ? 1 + Math.abs(Math.sin(this._pulso * 5)) * 0.04 : 1;
    this.rotuloTinta.text = `tinta ${Math.floor(jogo.tinta)}`;
    this.info.text = `tempo ${formatarTempo(jogo.tempo)}`;
    this.vidas.text = "vidas " + "♥ ".repeat(Math.max(0, jogo.vidas)) + "♡ ".repeat(Math.max(0, jogo.vidasMax - jogo.vidas));

    this._tempoAviso -= dt;
    this.textoAviso.alpha = Math.max(0, Math.min(1, this._tempoAviso * 2.5));
    if (this._aparecerFim) this.telaFim.alpha = Math.min(1, this.telaFim.alpha + dt * 2);
  }
}
