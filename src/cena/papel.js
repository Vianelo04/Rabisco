// Texturas e materiais do caderno, todos desenhados por código (DynamicTexture),
// sem nenhuma imagem externa.
import { DynamicTexture, StandardMaterial, Color3, Texture } from "@babylonjs/core";

export const CORES = {
  papel: "#fbf7ea",
  pauta: "#9cc3e6",
  margem: "#e06666",
  grafite: "#2b2b2b",
  tinta: "#1d3c8f",
  mesa: "#4a3a2c",
};

export const FONTE = '"Patrick Hand", cursive';

/** Quantas unidades do mundo cabem em uma repetição das texturas de papel. */
export const TAMANHO_AZULEJO = 12.8;

function novaTextura(nome, largura, altura, scene, alfa = false) {
  const tex = new DynamicTexture(nome, { width: largura, height: altura }, scene, true);
  tex.hasAlpha = alfa;
  return tex;
}

/** Leve granulado de papel. */
function granular(ctx, largura, altura, quantidade, cor) {
  ctx.fillStyle = cor;
  for (let i = 0; i < quantidade; i++) {
    ctx.globalAlpha = Math.random() * 0.08;
    ctx.fillRect(Math.random() * largura, Math.random() * altura, 2, 2);
  }
  ctx.globalAlpha = 1;
}

/** Folha pautada (linhas azuis horizontais), repetível. */
export function texturaPautada(scene) {
  const tam = 1024;
  const tex = novaTextura("pautada", tam, tam, scene);
  const ctx = tex.getContext();
  ctx.fillStyle = CORES.papel;
  ctx.fillRect(0, 0, tam, tam);
  granular(ctx, tam, tam, 6000, "#000");
  ctx.strokeStyle = CORES.pauta;
  ctx.lineWidth = 3;
  for (let y = 32; y < tam; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(tam, y);
    ctx.stroke();
  }
  tex.update();
  tex.wrapU = tex.wrapV = Texture.WRAP_ADDRESSMODE;
  return tex;
}

/** Papel quadriculado (usado no "chão" recortado), repetível. */
export function texturaQuadriculada(scene) {
  const tam = 1024;
  const tex = novaTextura("quadriculada", tam, tam, scene);
  const ctx = tex.getContext();
  ctx.fillStyle = "#f3ecd8";
  ctx.fillRect(0, 0, tam, tam);
  granular(ctx, tam, tam, 6000, "#000");
  ctx.strokeStyle = "#c9c0a8";
  ctx.lineWidth = 2;
  for (let p = 0; p <= tam; p += 64) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, tam);
    ctx.moveTo(0, p);
    ctx.lineTo(tam, p);
    ctx.stroke();
  }
  tex.update();
  tex.wrapU = tex.wrapV = Texture.WRAP_ADDRESSMODE;
  return tex;
}

/** Material fosco de papel. */
export function materialPapel(scene, nome, textura, uEscala = 1, vEscala = 1) {
  const mat = new StandardMaterial(nome, scene);
  const tex = textura;
  tex.uScale = uEscala;
  tex.vScale = vEscala;
  mat.diffuseTexture = tex;
  mat.specularColor = Color3.Black();
  mat.emissiveColor = new Color3(0.18, 0.17, 0.15);
  return mat;
}

/** Material "de tinta": cor chapada, sem brilho. */
export function materialTinta(scene, nome, hex, emissao = 0.6) {
  const mat = new StandardMaterial(nome, scene);
  const cor = Color3.FromHexString(hex);
  mat.diffuseColor = cor;
  mat.emissiveColor = cor.scale(emissao);
  mat.specularColor = Color3.Black();
  return mat;
}

/** Material transparente com o conteúdo de um canvas 2D (textos e desenhos no papel). */
export function materialDeCanvas(scene, nome, largura, altura, desenhar) {
  const tex = novaTextura(nome, largura, altura, scene, true);
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, largura, altura);
  desenhar(ctx, largura, altura);
  tex.update();
  const mat = new StandardMaterial(nome, scene);
  mat.diffuseTexture = tex;
  mat.useAlphaFromDiffuseTexture = true;
  mat.emissiveColor = Color3.White();
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  return mat;
}

/** Texto manuscrito (anotações do caderno). */
export function desenharTexto(linhas, tamanho = 64, cor = CORES.grafite) {
  return (ctx, largura, altura) => {
    ctx.font = `${tamanho}px ${FONTE}`;
    ctx.fillStyle = cor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const alturaLinha = tamanho * 1.15;
    const inicio = altura / 2 - ((linhas.length - 1) * alturaLinha) / 2;
    linhas.forEach((l, i) => ctx.fillText(l, largura / 2, inicio + i * alturaLinha));
  };
}

/** Rasgo no papel: mancha escura (a mesa aparecendo) com borda irregular. */
export function desenharRasgo(ctx, largura, altura) {
  const borda = 26;
  const pontos = [];
  // borda superior irregular
  for (let x = 0; x <= largura; x += 18) pontos.push([x, borda + (Math.random() - 0.5) * borda]);
  pontos.push([largura - Math.random() * 10, altura]);
  pontos.push([Math.random() * 10, altura]);
  // lados irregulares
  const lados = [];
  for (let y = altura; y > borda; y -= 30) lados.push([6 + Math.random() * 16, y]);
  const caminho = [...pontos, ...lados];

  // sombra/rebarba branca do papel rasgado
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  caminho.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - 6) : ctx.moveTo(x, y - 6)));
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = CORES.mesa;
  ctx.beginPath();
  caminho.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();

  // veios da madeira da mesa
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 3;
  for (let y = borda + 40; y < altura; y += 34) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.bezierCurveTo(largura * 0.3, y + 8, largura * 0.6, y - 8, largura - 20, y + 4);
    ctx.stroke();
  }
}

/** Pequenos desenhos decorativos feitos "à caneta" no fundo da página. */
export function desenharDoodle(tipo, cor = CORES.tinta, opacidade = 0.55) {
  if (DOODLES_COLORIDOS[tipo]) return DOODLES_COLORIDOS[tipo];
  return (ctx, l, a) => {
    ctx.strokeStyle = cor;
    ctx.globalAlpha = opacidade;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const cx = l / 2;
    const cy = a / 2;
    ctx.beginPath();
    if (tipo === "sol") {
      ctx.arc(cx, cy, l * 0.18, 0, Math.PI * 2);
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        ctx.moveTo(cx + Math.cos(ang) * l * 0.25, cy + Math.sin(ang) * l * 0.25);
        ctx.lineTo(cx + Math.cos(ang) * l * 0.38, cy + Math.sin(ang) * l * 0.38);
      }
    } else if (tipo === "nuvem") {
      ctx.arc(cx - l * 0.18, cy + 10, l * 0.14, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(cx, cy - 10, l * 0.2, Math.PI, Math.PI * 2);
      ctx.arc(cx + l * 0.2, cy + 10, l * 0.14, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath();
    } else if (tipo === "estrela") {
      for (let i = 0; i <= 10; i++) {
        const r = i % 2 ? l * 0.15 : l * 0.38;
        const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
    } else if (tipo === "coracao") {
      ctx.moveTo(cx, cy + a * 0.3);
      ctx.bezierCurveTo(cx - l * 0.5, cy - a * 0.05, cx - l * 0.2, cy - a * 0.4, cx, cy - a * 0.12);
      ctx.bezierCurveTo(cx + l * 0.2, cy - a * 0.4, cx + l * 0.5, cy - a * 0.05, cx, cy + a * 0.3);
    } else if (tipo === "espiral") {
      for (let i = 0; i < 80; i++) {
        const ang = i * 0.25;
        const r = i * 2.4;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  };
}

/** Papel liso (últimas páginas, onde o dono do caderno desenha). */
export function texturaLisa(scene) {
  const tam = 1024;
  const tex = novaTextura("lisa", tam, tam, scene);
  const ctx = tex.getContext();
  ctx.fillStyle = "#fdfbf4";
  ctx.fillRect(0, 0, tam, tam);
  granular(ctx, tam, tam, 9000, "#000");
  tex.update();
  tex.wrapU = tex.wrapV = Texture.WRAP_ADDRESSMODE;
  return tex;
}

// ---------- desenhos coloridos "de criança" (giz de cera / canetinha) ----------
function giz(ctx, cor, largura = 12) {
  ctx.strokeStyle = cor;
  ctx.fillStyle = cor;
  ctx.lineWidth = largura;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.85;
}

function hachura(ctx, x0, y0, x1, y1, cor) {
  // preenchimento rabiscado em zigue-zague, como pintura de giz de cera
  ctx.save();
  giz(ctx, cor, 6);
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  for (let x = x0; x < x1; x += 14) {
    ctx.moveTo(x, y1);
    ctx.lineTo(x + 10, y0);
  }
  ctx.stroke();
  ctx.restore();
}

const DOODLES_COLORIDOS = {
  solSorridente(ctx, l, a) {
    const cx = l / 2, cy = a / 2, r = l * 0.2;
    hachura(ctx, cx - r, cy - r, cx + r, cy + r, "#f5c518");
    giz(ctx, "#f0a500");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    for (let i = 0; i < 12; i++) {
      const g = (i / 12) * Math.PI * 2;
      ctx.moveTo(cx + Math.cos(g) * r * 1.3, cy + Math.sin(g) * r * 1.3);
      ctx.lineTo(cx + Math.cos(g) * r * 1.8, cy + Math.sin(g) * r * 1.8);
    }
    ctx.stroke();
    giz(ctx, "#333", 8);
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.2, 5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.35, cy - r * 0.2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.05, r * 0.5, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  },
  casinha(ctx, l, a) {
    const x0 = l * 0.2, x1 = l * 0.8, yb = a * 0.85, yt = a * 0.45;
    hachura(ctx, x0, yt, x1, yb, "#f28c8c");
    giz(ctx, "#c0392b");
    ctx.beginPath();
    ctx.rect(x0, yt, x1 - x0, yb - yt);
    ctx.moveTo(x0 - 20, yt);
    ctx.lineTo(l / 2, a * 0.15);
    ctx.lineTo(x1 + 20, yt);
    ctx.stroke();
    giz(ctx, "#6b4226");
    ctx.beginPath();
    ctx.rect(l * 0.44, a * 0.62, l * 0.12, yb - a * 0.62);
    ctx.stroke();
    giz(ctx, "#3a7bd5");
    ctx.beginPath();
    ctx.rect(l * 0.26, a * 0.52, l * 0.12, a * 0.1);
    ctx.rect(l * 0.62, a * 0.52, l * 0.12, a * 0.1);
    ctx.stroke();
  },
  arvore(ctx, l, a) {
    hachura(ctx, l * 0.25, a * 0.1, l * 0.75, a * 0.55, "#5aa469");
    giz(ctx, "#2e7d32");
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const g = (i / 7) * Math.PI * 2;
      ctx.arc(l / 2 + Math.cos(g) * l * 0.16, a * 0.33 + Math.sin(g) * a * 0.14, l * 0.12, 0, Math.PI * 2);
    }
    ctx.stroke();
    giz(ctx, "#6b4226", 16);
    ctx.beginPath();
    ctx.moveTo(l * 0.47, a * 0.95);
    ctx.lineTo(l * 0.48, a * 0.55);
    ctx.moveTo(l * 0.55, a * 0.95);
    ctx.lineTo(l * 0.53, a * 0.55);
    ctx.stroke();
  },
  flor(ctx, l, a) {
    giz(ctx, "#2e7d32");
    ctx.beginPath();
    ctx.moveTo(l / 2, a * 0.95);
    ctx.quadraticCurveTo(l * 0.4, a * 0.7, l / 2, a * 0.42);
    ctx.stroke();
    giz(ctx, "#e056a0");
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const g = (i / 6) * Math.PI * 2;
      ctx.moveTo(l / 2 + Math.cos(g) * l * 0.2 + l * 0.1, a * 0.3 + Math.sin(g) * l * 0.2);
      ctx.arc(l / 2 + Math.cos(g) * l * 0.2, a * 0.3 + Math.sin(g) * l * 0.2, l * 0.1, 0, Math.PI * 2);
    }
    ctx.stroke();
    giz(ctx, "#f5c518");
    ctx.beginPath();
    ctx.arc(l / 2, a * 0.3, l * 0.08, 0, Math.PI * 2);
    ctx.fill();
  },
  bonequinho(ctx, l, a) {
    giz(ctx, "#333", 9);
    ctx.beginPath();
    ctx.arc(l / 2, a * 0.22, l * 0.12, 0, Math.PI * 2);
    ctx.moveTo(l / 2, a * 0.34);
    ctx.lineTo(l / 2, a * 0.65);
    ctx.lineTo(l * 0.35, a * 0.92);
    ctx.moveTo(l / 2, a * 0.65);
    ctx.lineTo(l * 0.65, a * 0.92);
    ctx.moveTo(l * 0.28, a * 0.3);
    ctx.lineTo(l / 2, a * 0.45);
    ctx.lineTo(l * 0.72, a * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(l / 2, a * 0.24, l * 0.06, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  },
  nuvemColorida(ctx, l, a) {
    hachura(ctx, l * 0.15, a * 0.35, l * 0.85, a * 0.7, "#8ec5ff");
    giz(ctx, "#3a7bd5");
    ctx.beginPath();
    ctx.arc(l * 0.32, a * 0.55, l * 0.15, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(l * 0.5, a * 0.42, l * 0.2, Math.PI, Math.PI * 2);
    ctx.arc(l * 0.7, a * 0.55, l * 0.15, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.stroke();
  },
  coracaoColorido(ctx, l, a) {
    hachura(ctx, l * 0.2, a * 0.2, l * 0.8, a * 0.8, "#ff6b8b");
    giz(ctx, "#e0245e");
    ctx.beginPath();
    ctx.moveTo(l / 2, a * 0.85);
    ctx.bezierCurveTo(l * 0.0, a * 0.5, l * 0.25, a * 0.05, l / 2, a * 0.32);
    ctx.bezierCurveTo(l * 0.75, a * 0.05, l, a * 0.5, l / 2, a * 0.85);
    ctx.stroke();
  },
  atomo(ctx, l, a) {
    ctx.strokeStyle = "#2e7d32";
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(l / 2, a / 2, l * 0.4, l * 0.14, (i * Math.PI) / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.arc(l / 2, a / 2, 12, 0, Math.PI * 2);
    ctx.fill();
  },
  dna(ctx, l, a) {
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 6;
    for (const [cor, fase] of [["#1d3c8f", 0], ["#e06666", Math.PI]]) {
      ctx.strokeStyle = cor;
      ctx.beginPath();
      for (let y = 10; y < a - 10; y += 6) {
        const x = l / 2 + Math.sin(y * 0.04 + fase) * l * 0.25;
        y === 10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 4;
    for (let y = 20; y < a - 10; y += 22) {
      ctx.beginPath();
      ctx.moveTo(l / 2 + Math.sin(y * 0.04) * l * 0.25, y);
      ctx.lineTo(l / 2 + Math.sin(y * 0.04 + Math.PI) * l * 0.25, y);
      ctx.stroke();
    }
  },
};
