const ESQUERDA = ["KeyA", "ArrowLeft"];
const DIREITA = ["KeyD", "ArrowRight"];
const PULO = ["Space", "KeyW", "ArrowUp"];
const BLOQUEAR_ROLAGEM = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

export class Entrada {
  constructor() {
    this.teclas = new Set();
    this.pedidoDePulo = false;
    this.atalhos = new Map();

    window.addEventListener("keydown", (e) => {
      if (BLOQUEAR_ROLAGEM.includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.teclas.add(e.code);
      if (PULO.includes(e.code)) this.pedidoDePulo = true;
      this.atalhos.get(e.code)?.();
    });
    window.addEventListener("keyup", (e) => this.teclas.delete(e.code));
    window.addEventListener("blur", () => this.teclas.clear());
  }

  get eixoX() {
    const esq = ESQUERDA.some((k) => this.teclas.has(k)) ? 1 : 0;
    const dir = DIREITA.some((k) => this.teclas.has(k)) ? 1 : 0;
    return dir - esq;
  }

  get segurandoPulo() {
    return PULO.some((k) => this.teclas.has(k));
  }

  consumirPulo() {
    const p = this.pedidoDePulo;
    this.pedidoDePulo = false;
    return p;
  }

  aoPressionar(codigo, acao) {
    this.atalhos.set(codigo, acao);
  }

  limparAtalhos() {
    this.atalhos.clear();
  }
}
