// Sons e música sintetizados na hora (Web Audio API): nenhum arquivo de áudio externo,
// então não há problema de direitos autorais nem de carregamento.

const ACORDES = [
  [261.63, 329.63, 392.0], // Dó
  [220.0, 261.63, 329.63], // Lá menor
  [174.61, 220.0, 261.63], // Fá
  [196.0, 246.94, 293.66], // Sol
];
// melodia: índice da nota dentro do acorde (0-2, +3 = oitava acima), null = pausa
const MELODIA = [3, null, 4, 5, null, 4, 3, null, 2, null, 3, 4, null, null, 5, null];
const BPM = 100;

export class Audio {
  constructor() {
    this.ctx = null;
    this.mudo = false;
  }

  /** Precisa ser chamado depois de um clique (regra de autoplay dos navegadores). */
  iniciar() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.mestre = ctx.createGain();
    this.mestre.gain.value = 0.7;
    this.mestre.connect(ctx.destination);

    // ruído branco reaproveitado em vários efeitos
    this.ruido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const dados = this.ruido.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

    this._criarRisco();
    this._criarEsfregar();
    this._iniciarMusica();
  }

  /** Som grave de borracha esfregando, que aumenta conforme ela se aproxima. */
  _criarEsfregar() {
    const fonte = this.ctx.createBufferSource();
    fonte.buffer = this.ruido;
    fonte.loop = true;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 520;
    const vaiVem = this.ctx.createGain();
    vaiVem.gain.value = 0.6;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 4.5; // o "vai e vem" da borracha
    const prof = this.ctx.createGain();
    prof.gain.value = 0.4;
    lfo.connect(prof).connect(vaiVem.gain);
    this.ganhoEsfregar = this.ctx.createGain();
    this.ganhoEsfregar.gain.value = 0;
    fonte.connect(filtro).connect(vaiVem).connect(this.ganhoEsfregar).connect(this.mestre);
    fonte.start();
    lfo.start();
  }

  /** @param {number} intensidade 0 (longe) a 1 (colada no jogador) */
  borracha(intensidade) {
    if (!this.ctx) return;
    this.ganhoEsfregar.gain.setTargetAtTime(intensidade * 0.55, this.ctx.currentTime, 0.1);
  }

  fimDeJogo() {
    [392, 330, 262, 196].forEach((f, i) => this._tom(f, 0.3, { tipo: "triangle", vol: 0.14, atraso: i * 0.18 }));
  }

  alternarMudo() {
    if (!this.ctx) return this.mudo;
    this.mudo = !this.mudo;
    this.mestre.gain.setTargetAtTime(this.mudo ? 0 : 0.7, this.ctx.currentTime, 0.05);
    return this.mudo;
  }

  _tom(freq, dur, { tipo = "square", vol = 0.15, ate = null, atraso = 0, destino = this.mestre } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + atraso;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (ate) osc.frequency.exponentialRampToValueAtTime(ate, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(destino);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _chiado(dur, { vol = 0.2, freq = 2000, q = 1, tipo = "bandpass" } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const fonte = this.ctx.createBufferSource();
    fonte.buffer = this.ruido;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.value = freq;
    filtro.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    fonte.connect(filtro).connect(g).connect(this.mestre);
    fonte.start(t, Math.random());
    fonte.stop(t + dur);
  }

  // ---------- efeitos ----------
  pulo() {
    this._tom(330, 0.14, { ate: 660, vol: 0.08 });
  }
  pousar() {
    this._chiado(0.08, { vol: 0.25, freq: 300, tipo: "lowpass" });
  }
  traco() {
    this._tom(520, 0.08, { tipo: "triangle", vol: 0.12 });
    this._tom(780, 0.1, { tipo: "triangle", vol: 0.1, atraso: 0.05 });
  }
  apagar() {
    this._chiado(0.3, { vol: 0.35, freq: 1400, q: 0.7 });
  }
  coleta() {
    [784, 988, 1319].forEach((f, i) => this._tom(f, 0.15, { tipo: "triangle", vol: 0.12, atraso: i * 0.06 }));
  }
  checkpoint() {
    [523, 659, 784, 1047].forEach((f, i) => this._tom(f, 0.18, { tipo: "triangle", vol: 0.12, atraso: i * 0.07 }));
  }
  derrota() {
    this._tom(440, 0.45, { tipo: "sawtooth", ate: 90, vol: 0.12 });
    this._chiado(0.4, { vol: 0.15, freq: 600 });
  }
  erro() {
    this._tom(160, 0.15, { tipo: "square", vol: 0.08 });
  }
  vitoria() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      this._tom(f, i === 5 ? 0.6 : 0.16, { tipo: "triangle", vol: 0.14, atraso: i * 0.11 })
    );
  }

  // ---------- som contínuo do lápis riscando ----------
  _criarRisco() {
    const fonte = this.ctx.createBufferSource();
    fonte.buffer = this.ruido;
    fonte.loop = true;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = 3200;
    filtro.Q.value = 1.4;
    this.ganhoRisco = this.ctx.createGain();
    this.ganhoRisco.gain.value = 0;
    // tremolo: deixa o chiado com textura de grafite no papel
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 13;
    const tremolo = this.ctx.createGain();
    tremolo.gain.value = 0.7;
    const profundidade = this.ctx.createGain();
    profundidade.gain.value = 0.3;
    lfo.connect(profundidade).connect(tremolo.gain);
    fonte.connect(filtro).connect(tremolo).connect(this.ganhoRisco).connect(this.mestre);
    fonte.start();
    lfo.start();
  }

  riscar(ativo) {
    if (!this.ctx) return;
    this.ganhoRisco.gain.setTargetAtTime(ativo ? 0.09 : 0, this.ctx.currentTime, 0.03);
  }

  // ---------- música de fundo ----------
  _iniciarMusica() {
    const ctx = this.ctx;
    this.musica = ctx.createGain();
    this.musica.gain.value = 0.55;
    this.musica.connect(this.mestre);
    const colcheia = 60 / BPM / 2;
    let passo = 0;
    let proximo = ctx.currentTime + 0.1;

    const agendar = () => {
      while (proximo < ctx.currentTime + 0.2) {
        const acorde = ACORDES[Math.floor(passo / 8) % ACORDES.length];
        const atraso = proximo - ctx.currentTime;
        const nota = MELODIA[passo % MELODIA.length];
        if (nota !== null) {
          const f = acorde[nota % 3] * (nota >= 3 ? 2 : 1);
          this._tom(f, colcheia * 1.6, { tipo: "triangle", vol: 0.05, atraso, destino: this.musica });
        }
        if (passo % 4 === 0) {
          this._tom(acorde[0] / 2, colcheia * 3.5, { tipo: "sine", vol: 0.09, atraso, destino: this.musica });
        }
        if (passo % 2 === 1) {
          // "tique" leve como lápis batendo na mesa
          this._tom(1800, 0.03, { tipo: "square", vol: 0.012, atraso, destino: this.musica });
        }
        proximo += colcheia;
        passo++;
      }
    };
    setInterval(agendar, 50);
  }
}
