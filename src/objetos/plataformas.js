import { criarRabiscoSolido } from "./rabiscoSolido.js";

function registrar(ctx, corpo, estado) {
  ctx.plataformas.set(corpo, {
    velocidadeEm(p, out) {
      out.x = estado.vx - estado.w * (p.y - estado.y);
      out.y = estado.vy + estado.w * (p.x - estado.x);
    },
  });
}

function novoEstado([x, y, rot = 0]) {
  return { x, y, rot, vx: 0, vy: 0, w: 0 };
}

function aplicar(estado, r, [x, y, rot = 0], dt) {
  if (dt > 0) {
    estado.vx = (x - estado.x) / dt;
    estado.vy = (y - estado.y) / dt;
    estado.w = (rot - estado.rot) / dt;
  } else {
    estado.vx = estado.vy = estado.w = 0;
  }
  estado.x = x;
  estado.y = y;
  estado.rot = rot;
  r.mover(x, y, rot);
}

export function plataformaMovel(scene, ctx, opcoes, caminho) {
  const inicio = caminho(0);
  const r = criarRabiscoSolido(scene, ctx, { ...opcoes, movel: true, posicao: inicio, rotacao: inicio[2] ?? 0 });
  const estado = novoEstado(inicio);
  registrar(ctx, r.corpo, estado);
  let t = 0;
  return {
    r,
    atualizar(dt) {
      t += dt;
      aplicar(estado, r, caminho(t), dt);
    },
    resetar() {
      t = 0;
      aplicar(estado, r, caminho(0), 0);
    },
  };
}

export function plataformaGatilho(scene, ctx, opcoes, caminho, duracao, aoDisparar) {
  const inicio = caminho(0);
  const r = criarRabiscoSolido(scene, ctx, { ...opcoes, movel: true, posicao: inicio, rotacao: inicio[2] ?? 0 });
  const estado = novoEstado(inicio);
  registrar(ctx, r.corpo, estado);
  let t = 0;
  let ativa = false;
  return {
    r,
    get ativa() {
      return ativa;
    },
    get tempo() {
      return t;
    },
    atualizar(dt, { jogador }) {
      if (!ativa) {
        if (jogador.corpoChao === r.corpo && !jogador.morto) {
          ativa = true;
          aoDisparar?.();
        } else {
          aplicar(estado, r, inicio, dt);
          return;
        }
      }
      t += dt;
      if (t >= duracao) {
        t = 0;
        ativa = false;
        aplicar(estado, r, inicio, 0);
        return;
      }
      aplicar(estado, r, caminho(t), dt);
    },
    resetar() {
      t = 0;
      ativa = false;
      aplicar(estado, r, inicio, 0);
    },
  };
}

export function plataformaQueCai(scene, ctx, opcoes, [x, y]) {
  const r = criarRabiscoSolido(scene, ctx, { ...opcoes, movel: true, posicao: [x, y] });
  const estado = novoEstado([x, y]);
  registrar(ctx, r.corpo, estado);
  let pisada = -1;
  let queda = 0;
  let vel = 0;
  let tremor = 0;
  const reset = () => {
    pisada = -1;
    queda = 0;
    vel = 0;
    aplicar(estado, r, [x, y], 0);
  };
  return {
    r,
    atualizar(dt, { jogador }) {
      if (pisada < 0 && jogador.corpoChao === r.corpo) pisada = 0;
      if (pisada < 0) return;
      pisada += dt;
      if (pisada < 0.35) {
        tremor += dt * 60;
        aplicar(estado, r, [x + Math.sin(tremor) * 0.05, y], dt);
        return;
      }
      vel += 25 * dt;
      queda += vel * dt;
      aplicar(estado, r, [x, y - queda], dt);
      if (pisada > 2.8) reset();
    },
    resetar: reset,
  };
}

export const caminhos = {
  vaiVem: ([x0, y0], [x1, y1], periodo, fase = 0) => (t) => {
    const k = (1 - Math.cos(((t / periodo) * 2 + fase) * Math.PI)) / 2;
    return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, 0];
  },
  giro: ([x, y], velAngular, fase = 0) => (t) => [x, y, fase + t * velAngular],
  orbita: ([cx, cy], raio, velAngular, fase = 0) => (t) => [
    cx + Math.cos(fase + t * velAngular) * raio,
    cy + Math.sin(fase + t * velAngular) * raio,
    0,
  ],
};
