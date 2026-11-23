import { Scene, Vector3, Color4, HavokPlugin, GlowLayer } from "@babylonjs/core";

import { Efeitos } from "./efeitos.js";
import { Hud } from "./hud.js";
import { Jogador } from "./jogador.js";
import { Desenho } from "./desenho.js";
import { Borracha } from "./borracha.js";
import { Obstaculos } from "./obstaculos.js";
import { criarCamera } from "./camera.js";
import { criarIluminacao } from "./cena/luz.js";
import { virarPagina } from "./cena/viragem.js";
import { construirFase } from "./fases/construtor.js";
import { VIDAS, tintaDaFase } from "./config.js";
import { progresso, formatarTempo } from "./progresso.js";

const GRAVIDADE = -28;

export function criarPartida({ engine, havok, audio, entrada, def, indice, dif, acoes }) {
  entrada.limparAtalhos();
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.29, 0.23, 0.17, 1);
  scene.enablePhysics(new Vector3(0, GRAVIDADE, 0), new HavokPlugin(true, havok));
  const fisica = scene.getPhysicsEngine();

  const brilho = new GlowLayer("brilho", scene, { blurKernelSize: 48 });
  brilho.intensity = 0.7;

  const cam = criarCamera(scene);
  const luz = criarIluminacao(scene);
  const efeitos = new Efeitos(scene);
  const hud = new Hud(scene, { titulo: `${indice + 1}. ${def.materia}`, dificuldade: dif.nome });

  const plataformas = new Map();
  const fase = construirFase(def, { scene, sombras: luz.sombras, brilho, efeitos, audio, plataformas });
  const tinta = tintaDaFase(def, dif);
  fase.frascos.forEach((f, i) => (f.quantidade = tinta.frascos[i]));

  const jogo = {
    estado: "jogando",
    tinta: tinta.inicial,
    tintaMax: tinta.max,
    vidas: VIDAS,
    vidasMax: VIDAS,
    tempo: 0,
    progresso: 0,
    checkpoint: fase.spawn.clone(),
    tintaNoCheckpoint: tinta.inicial,
    tracosNoCheckpoint: new Set(),
  };

  const jogador = new Jogador(scene, entrada, luz.sombras, efeitos, audio);
  jogador.plataformas = plataformas;
  const desenho = new Desenho(scene, cam.camera, {
    jogo,
    hud,
    audio,
    efeitos,
    sombras: luz.sombras,
    reembolsoDesfazer: dif.reembolsoDesfazer,
    podeDesenhar: () => jogo.estado === "jogando" && !jogador.morto,
  });
  const borracha = new Borracha(scene, luz.sombras, efeitos.textura, dif.velBorracha);
  const obstaculos = new Obstaculos(scene, luz.sombras, fase.obstaculos);
  let paginaVirada = null;

  function salvarCheckpoint() {
    jogo.tintaNoCheckpoint = jogo.tinta;
    jogo.tracosNoCheckpoint = new Set(desenho.tracos);
    fase.frascos.forEach((f) => (f.garantido = f.coletado));
  }

  function voltarAoCheckpoint() {
    jogo.tinta = jogo.tintaNoCheckpoint;
    for (const f of fase.frascos) {
      if (f.coletado && !f.garantido) {
        f.coletado = false;
        f.no.setEnabled(f.quantidade > 0);
      }
    }
    for (const tr of [...desenho.tracos]) if (!jogo.tracosNoCheckpoint.has(tr)) desenho.apagar(tr, true);
  }

  function perderVida() {
    if (jogador.morto || jogo.estado !== "jogando") return;
    efeitos.puf(jogador.posicao.clone());
    jogador.morrer();
    desenho.cancelar();
    jogo.vidas--;
    audio.derrota();
    if (jogo.vidas <= 0) {
      setTimeout(() => !scene.isDisposed && fimDeJogo(), 700);
      return;
    }
    hud.aviso(jogo.vidas === 1 ? "última vida!" : `restam ${jogo.vidas} vidas`);
    setTimeout(() => {
      if (scene.isDisposed || jogo.estado === "fim") return;
      obstaculos.limpar();
      voltarAoCheckpoint();
      jogador.reviver(jogo.checkpoint);
      borracha.resetar(jogo.checkpoint, Math.min(dif.esperaBorracha, 1.8));
    }, 750);
  }

  function fimDeJogo() {
    jogo.estado = "fim";
    borracha.parar();
    audio.borracha(0);
    audio.fimDeJogo();
    hud.mostrarFim({
      venceu: false,
      titulo: "Apagado!",
      subtitulo: "Suas vidas acabaram. A fase recomeça do início.",
      resumo: `você chegou a ${Math.round(jogo.progresso * 100)}% da página`,
      botao: "tentar de novo",
    });
    acaoPrincipal = recomecar;
  }

  function vencer() {
    jogo.estado = "fim";
    jogador.parar();
    desenho.cancelar();
    borracha.parar();
    audio.borracha(0);
    audio.vitoria();
    const recorde = progresso.concluir(indice, def.id, dif.id, jogo.tempo);
    virarPagina(scene, cam.camera).then((p) => {
      if (scene.isDisposed) return;
      paginaVirada = p;
      brilho.isEnabled = false;
      const final = !acoes.temProxima;
      hud.mostrarFim({
        venceu: true,
        titulo: final ? "Fim do caderno!" : "Página concluída!",
        subtitulo: final ? def.mensagemFinal ?? "Você escapou da Borracha até a contracapa!" : `${def.materia}: a Borracha ficou para trás.`,
        resumo: `tempo ${formatarTempo(jogo.tempo)}     vidas ${jogo.vidas}/${VIDAS}     dificuldade ${dif.nome}`,
        recorde: recorde ? "novo recorde!" : `recorde: ${formatarTempo(progresso.recorde(def.id, dif.id))}`,
        botao: final ? "jogar de novo" : "próxima matéria →",
      });
      acaoPrincipal = final ? recomecar : () => acoes.jogar(indice + 1);
    });
  }

  function recomecar() {
    desenho.limpar();
    obstaculos.limpar();
    fase.resetar();
    fase.frascos.forEach((f, i) => {
      f.quantidade = tinta.frascos[i];
      f.no.setEnabled(f.quantidade > 0);
    });
    paginaVirada?.dispose();
    paginaVirada = null;
    brilho.isEnabled = true;
    Object.assign(jogo, {
      estado: "jogando",
      tinta: tinta.inicial,
      vidas: VIDAS,
      tempo: 0,
      progresso: 0,
      checkpoint: fase.spawn.clone(),
      tintaNoCheckpoint: tinta.inicial,
      tracosNoCheckpoint: new Set(),
    });
    jogador.travado = false;
    jogador.reviver(jogo.checkpoint);
    borracha.resetar(jogo.checkpoint, dif.esperaBorracha);
    cam.seguir(jogo.checkpoint, 1, 0, true);
    fisica.setTimeStep(1 / 60);
    hud.mostrar("jogo");
    hud.aviso(`${def.materia}`, 2.2);
  }

  function pausar(sim) {
    if (jogo.estado === "fim") return;
    jogo.estado = sim ? "pausado" : "jogando";
    fisica.setTimeStep(sim ? 0 : 1 / 60);
    audio.borracha(0);
    audio.riscar(false);
    desenho.cancelar();
    hud.mostrar(sim ? "pausa" : "jogo");
  }

  let acaoPrincipal = recomecar;
  hud.botaoPrincipal.onPointerUpObservable.add(() => acaoPrincipal());
  hud.botaoMenuFim.onPointerUpObservable.add(() => acoes.menu());
  hud.botaoContinuar.onPointerUpObservable.add(() => pausar(false));
  hud.botaoReiniciar.onPointerUpObservable.add(() => recomecar());
  hud.botaoMenuPausa.onPointerUpObservable.add(() => acoes.menu());

  entrada.aoPressionar("KeyZ", () => desenho.desfazer());
  entrada.aoPressionar("KeyM", () => hud.aviso(audio.alternarMudo() ? "som desligado" : "som ligado"));
  const alternarPausa = () => jogo.estado !== "fim" && pausar(jogo.estado !== "pausado");
  entrada.aoPressionar("Escape", alternarPausa);
  entrada.aoPressionar("KeyP", alternarPausa);

  let relogio = 0;
  const larguraFase = fase.saida.posicao.x - fase.spawn.x;
  const estadoEspeciais = { jogador, perderVida, audio, efeitos };

  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, 1 / 20);
    if (jogo.estado === "pausado") return;
    relogio += dt;
    fase.animar(relogio);

    if (jogo.estado === "jogando") {
      jogo.tempo += dt;
      jogador.atualizar(dt);
      for (const e of fase.especiais) e.atualizar(dt, estadoEspeciais);
      if (borracha.atualizar(dt, jogador, desenho, perderVida)) hud.aviso("a borracha acordou! corra!");
      obstaculos.atualizar(dt, jogador, perderVida);

      const p = jogador.posicao;
      jogo.progresso = Math.max(jogo.progresso, Math.min(1, (p.x - fase.spawn.x) / larguraFase));

      const dist = borracha.ativa ? borracha.distancia(jogador) : Infinity;
      audio.borracha(borracha.ativa ? Math.max(0, Math.min(1, 1 - (dist - 2) / 14)) : 0);
      hud.alertarBorracha(borracha.ativa && dist > 9 && dist < 20);

      if (!jogador.morto) {
        if (p.y < fase.limiteQueda) perderVida();

        fase.checkpoints.forEach((c, i) => {
          if (!c.ativo && !jogador.morto && Vector3.Distance(p, c.posicao) < 1.3) {
            fase.checkpoints.forEach((o) => o.ativo && o.resetar());
            c.ativar();
            jogo.checkpoint = c.posicao.clone();
            salvarCheckpoint();
            audio.checkpoint();
            hud.aviso("checkpoint!");
          }
        });
        for (const f of fase.frascos) {
          if (!f.coletado && f.quantidade > 0 && Vector3.Distance(p, f.no.position) < 1.1) {
            f.coletado = true;
            f.no.setEnabled(false);
            jogo.tinta = Math.min(jogo.tintaMax, jogo.tinta + f.quantidade);
            efeitos.brilho(f.no.position.clone());
            audio.coleta();
            hud.aviso(`+ ${Math.round(f.quantidade)} de tinta`);
          }
        }
        if (Vector3.Distance(p, fase.saida.posicao) < 1.6) vencer();
      }
    } else {
      hud.alertarBorracha(false);
    }

    if (jogo.estado !== "fim" || !paginaVirada) cam.seguir(jogador.posicao, jogador.olhando, dt);
    luz.seguir(cam.foco);
    hud.atualizar(jogo, dt);
  });

  jogador.teleportar(fase.spawn);
  recomecar();

  window.__rabisco = { scene, jogo, jogador, desenho, borracha, obstaculos, fase, recomecar };

  return {
    scene,
    dispose() {
      audio.borracha(0);
      audio.riscar(false);
      scene.dispose();
    },
  };
}
