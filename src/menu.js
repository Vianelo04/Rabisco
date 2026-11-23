import {
  Scene,
  Color4,
  Color3,
  Vector3,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  TransformNode,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, StackPanel, Control, Grid } from "@babylonjs/gui";
import { texto, botao, FONTE_GUI } from "./hud.js";
import { CORES, FONTE, texturaPautada } from "./cena/papel.js";
import { DIFICULDADES } from "./config.js";
import { progresso, formatarTempo } from "./progresso.js";

function capaDoCaderno(scene) {
  const tex = new DynamicTexture("capa", { width: 768, height: 1024 }, scene, true);
  const c = tex.getContext();
  c.fillStyle = "#2f5bb7";
  c.fillRect(0, 0, 768, 1024);
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
    c.fillRect(Math.random() * 768, Math.random() * 1024, 2, 2);
  }
  c.fillStyle = "#fdfbf4";
  c.fillRect(150, 330, 470, 300);
  c.strokeStyle = "#1d3c8f";
  c.lineWidth = 6;
  c.strokeRect(150, 330, 470, 300);
  c.fillStyle = CORES.tinta;
  c.font = `140px ${FONTE}`;
  c.textAlign = "center";
  c.fillText("Rabisco", 385, 470);
  c.font = `46px ${FONTE}`;
  c.fillStyle = CORES.grafite;
  c.fillText("caderno de: ________", 385, 560);
  c.strokeStyle = "#fdfbf4";
  c.lineWidth = 8;
  c.lineCap = "round";
  c.beginPath();
  c.arc(600, 850, 50, 0, Math.PI * 2);
  c.moveTo(600, 900);
  c.lineTo(600, 980);
  c.stroke();
  tex.update();
  return tex;
}

function montarCaderno(scene, sombras) {
  const raiz = new TransformNode("caderno", scene);
  const matCapa = new StandardMaterial("matCapa", scene);
  matCapa.diffuseTexture = capaDoCaderno(scene);
  matCapa.specularColor = new Color3(0.1, 0.1, 0.1);
  const matMiolo = new StandardMaterial("matMiolo", scene);
  matMiolo.diffuseTexture = texturaPautada(scene);
  matMiolo.specularColor = Color3.Black();

  const capa = MeshBuilder.CreatePlane("capaFrente", { width: 6, height: 8 }, scene);
  capa.position.z = -0.36;
  capa.material = matCapa;
  capa.parent = raiz;
  const miolo = MeshBuilder.CreateBox("miolo", { width: 6, height: 8, depth: 0.7 }, scene);
  miolo.material = matMiolo;
  miolo.parent = raiz;
  sombras.addShadowCaster(miolo);

  const matEspiral = new StandardMaterial("matEspiral", scene);
  matEspiral.diffuseColor = new Color3(0.75, 0.77, 0.8);
  matEspiral.specularColor = Color3.White();
  for (let i = 0; i < 16; i++) {
    const anel = MeshBuilder.CreateTorus("anel", { diameter: 0.9, thickness: 0.07, tessellation: 20 }, scene);
    anel.rotation.y = Math.PI / 2;
    anel.position.set(-3, -3.6 + i * 0.48, 0);
    anel.material = matEspiral;
    anel.parent = raiz;
  }
  return raiz;
}

export function criarMenu({ engine, audio, entrada, fases, acoes, telaInicial = "capa" }) {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.29, 0.23, 0.17, 1);

  const camera = new ArcRotateCamera("cameraMenu", -Math.PI / 2, Math.PI / 2.15, 15, new Vector3(-3.2, 0, 0), scene);
  camera.inputs.clear();
  new HemisphericLight("luzMenu", new Vector3(0, 1, -0.5), scene).intensity = 0.65;
  const sol = new DirectionalLight("solMenu", new Vector3(0.4, -0.6, 0.7), scene);
  sol.position = new Vector3(-8, 10, -12);
  sol.intensity = 0.7;
  const sombras = new ShadowGenerator(1024, sol);
  sombras.usePercentageCloserFiltering = true;

  const mesa = MeshBuilder.CreatePlane("mesa", { size: 60 }, scene);
  mesa.position.z = 0.6;
  const matMesa = new StandardMaterial("matMesa", scene);
  matMesa.diffuseColor = Color3.FromHexString("#6b5038");
  matMesa.specularColor = Color3.Black();
  mesa.material = matMesa;
  mesa.receiveShadows = true;

  const caderno = montarCaderno(scene, sombras);
  caderno.position.set(-6.3, 0, 0);
  let t = 0;
  scene.onBeforeRenderObservable.add(() => {
    t += engine.getDeltaTime() / 1000;
    caderno.rotation.y = Math.sin(t * 0.6) * 0.35;
    caderno.rotation.x = Math.sin(t * 0.4) * 0.08;
    caderno.position.y = Math.sin(t * 1.1) * 0.15;
  });

  const ui = AdvancedDynamicTexture.CreateFullscreenUI("menu", true, scene);
  ui.idealHeight = 900;

  const painel = new Rectangle("painel");
  painel.width = "760px";
  painel.height = "820px";
  painel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  painel.left = "-60px";
  painel.thickness = 4;
  painel.color = CORES.grafite;
  painel.cornerRadius = 18;
  painel.background = "rgba(251, 247, 234, 0.96)";
  ui.addControl(painel);

  const telas = {};
  const novaTela = (nome) => {
    const pilha = new StackPanel(nome);
    pilha.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    painel.addControl(pilha);
    telas[nome] = pilha;
    return pilha;
  };
  const mostrar = (nome) => {
    for (const [n, tela] of Object.entries(telas)) tela.isVisible = n === nome;
    if (nome === "sumario") atualizarSumario();
  };

  const capa = novaTela("capa");
  capa.addControl(texto("Rabisco", 150, CORES.tinta));
  const historia = texto(
    "Um bonequinho rabiscado na margem do caderno ganhou vida.\nUma Borracha gigante está apagando tudo e vem atrás dele.\nDesenhe o caminho, matéria por matéria, até a contracapa!",
    30,
    "#555"
  );
  historia.textWrapping = true;
  historia.width = "680px";
  historia.height = "170px";
  capa.addControl(historia);
  const controles = texto("A D / ← → andar  ·  ESPAÇO pular  ·  MOUSE desenhar  ·  Z desfazer  ·  ESC pausa", 21);
  capa.addControl(controles);
  const bJogar = botao("jogar", "abrir o caderno");
  bJogar.onPointerUpObservable.add(() => {
    audio.iniciar();
    mostrar("dificuldade");
  });
  capa.addControl(bJogar);
  const bCreditos = botao("creditos", "créditos", { largura: 220, altura: 60, fundo: "#ffffff", tamanho: 30 });
  bCreditos.onPointerUpObservable.add(() => mostrar("creditos"));
  capa.addControl(bCreditos);

  const telaDif = novaTela("dificuldade");
  telaDif.addControl(texto("Dificuldade", 84, CORES.tinta));
  const corDif = { facil: "#d9f2dc", medio: "#fff6c9", dificil: "#ffd9d9" };
  for (const dif of Object.values(DIFICULDADES)) {
    const b = botao("dif-" + dif.id, dif.nome, { largura: 420, altura: 78, fundo: corDif[dif.id], tamanho: 42 });
    b.onPointerUpObservable.add(() => {
      progresso.dificuldade = dif.id;
      mostrar("sumario");
    });
    telaDif.addControl(b);
    const d = texto(dif.descricao, 26, "#555");
    telaDif.addControl(d);
  }
  const voltar1 = botao("voltar1", "← voltar", { largura: 200, altura: 60, fundo: "#ffffff", tamanho: 30 });
  voltar1.onPointerUpObservable.add(() => mostrar("capa"));
  telaDif.addControl(voltar1);

  const sumario = novaTela("sumario");
  const tituloSumario = texto("Sumário", 84, CORES.tinta);
  sumario.addControl(tituloSumario);
  const subSumario = texto("", 28, "#555");
  sumario.addControl(subSumario);
  const itens = fases.map((def, i) => {
    const b = botao("fase-" + def.id, "", { largura: 600, altura: 88, fundo: "#ffffff", tamanho: 36 });
    b.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    b.textBlock.paddingLeft = "28px";
    const aba = new Rectangle("aba");
    aba.width = "18px";
    aba.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    aba.thickness = 0;
    aba.background = def.cor;
    b.addControl(aba);
    const recorde = texto("", 24, "#777");
    recorde.width = "220px";
    recorde.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    recorde.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    recorde.left = "-20px";
    b.addControl(recorde);
    b.onPointerUpObservable.add(() => {
      if (i < progresso.desbloqueadas) acoes.jogar(i, progresso.dificuldade);
    });
    sumario.addControl(b);
    return { b, recorde, def };
  });
  const voltar2 = botao("voltar2", "← dificuldade", { largura: 240, altura: 60, fundo: "#ffffff", tamanho: 30 });
  voltar2.onPointerUpObservable.add(() => mostrar("dificuldade"));
  sumario.addControl(voltar2);

  function atualizarSumario() {
    const dif = DIFICULDADES[progresso.dificuldade];
    subSumario.text = `dificuldade: ${dif.nome}`;
    itens.forEach(({ b, recorde, def }, i) => {
      const liberada = i < progresso.desbloqueadas;
      b.textBlock.text = `${i + 1}. ${def.materia}${liberada ? "" : "  🔒"}`;
      b.alpha = liberada ? 1 : 0.45;
      const r = progresso.recorde(def.id, dif.id);
      recorde.text = !liberada ? "complete a anterior" : r != null ? `recorde ${formatarTempo(r)}` : "";
    });
  }

  const creditos = novaTela("creditos");
  creditos.addControl(texto("Créditos", 84, CORES.tinta));
  creditos.addControl(texto("Rabisco · jogo de plataforma feito com BabylonJS", 26, "#555"));
  const integrantes = [
    ["João Pedro Vianelo Saçço", "estrutura do projeto, menu, dificuldades e regras da partida"],
    ["João Pedro Maniezzi", "personagem, desenho de plataformas, som e fase Português"],
    ["Lucas Haddad", "visual do caderno, Borracha, obstáculos, HUD e fase Matemática"],
    ["Arthur Falcetti", "objetos temáticos e fases Ciências e Desenhos"],
  ];
  for (const [nome, parte] of integrantes) {
    const linhaNome = texto(nome, 36, CORES.grafite);
    linhaNome.height = "64px";
    linhaNome.paddingTop = "16px";
    creditos.addControl(linhaNome);
    creditos.addControl(texto(parte, 22, "#777"));
  }
  const voltarCreditos = botao("voltarCreditos", "← voltar", { largura: 200, altura: 60, fundo: "#ffffff", tamanho: 30 });
  voltarCreditos.onPointerUpObservable.add(() => mostrar("capa"));
  creditos.addControl(voltarCreditos);

  entrada.limparAtalhos();
  mostrar(telaInicial);

  return {
    scene,
    dispose() {
      scene.dispose();
    },
  };
}
