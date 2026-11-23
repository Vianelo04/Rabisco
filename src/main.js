import "./estilo.css";
import { Engine } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

import { Entrada } from "./entrada.js";
import { Audio } from "./audio.js";
import { criarMenu } from "./menu.js";
import { criarPartida } from "./partida.js";
import { FASES } from "./fases/index.js";
import { DIFICULDADES } from "./config.js";
import { progresso } from "./progresso.js";

async function iniciar() {
  const canvas = document.getElementById("jogo");
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  const engine = new Engine(canvas, true, { stencil: true, preserveDrawingBuffer: false });

  await Promise.race([document.fonts.load('64px "Patrick Hand"'), new Promise((r) => setTimeout(r, 2500))]);
  const havok = await HavokPhysics();

  const audio = new Audio();
  const entrada = new Entrada();
  let atual = null;

  function trocar(criar) {
    setTimeout(() => {
      atual?.dispose();
      atual = criar();
    }, 0);
  }

  function abrirMenu(tela = "capa") {
    trocar(() => criarMenu({ engine, audio, entrada, fases: FASES, telaInicial: tela, acoes: { jogar } }));
  }

  function jogar(indice, difId = progresso.dificuldade) {
    const def = FASES[indice];
    if (!def) return abrirMenu("sumario");
    trocar(() =>
      criarPartida({
        engine,
        havok,
        audio,
        entrada,
        def,
        indice,
        dif: DIFICULDADES[difId] ?? DIFICULDADES.medio,
        acoes: { menu: () => abrirMenu("sumario"), jogar: (i) => jogar(i), temProxima: indice < FASES.length - 1 },
      })
    );
  }

  abrirMenu();
  document.getElementById("carregando").remove();
  engine.runRenderLoop(() => atual?.scene.render());
  window.addEventListener("resize", () => engine.resize());

  window.addEventListener("keydown", async (e) => {
    if (e.shiftKey && e.ctrlKey && e.altKey && e.code === "KeyI" && atual) {
      await import("@babylonjs/inspector");
      atual.scene.debugLayer.show({ embedMode: true });
    }
  });

  window.__jogo = { jogar, abrirMenu, progresso };
}

iniciar().catch((erro) => {
  console.error(erro);
  document.getElementById("carregando").textContent = "erro ao abrir o caderno :( veja o console";
});
