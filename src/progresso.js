const CHAVE = "rabisco-progresso-v1";

function ler() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto);
  } catch {
  }
  return { desbloqueadas: 1, recordes: {}, dificuldade: "medio" };
}

function gravar(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
  }
}

export const progresso = {
  dados: ler(),

  get desbloqueadas() {
    return this.dados.desbloqueadas;
  },

  get dificuldade() {
    return this.dados.dificuldade ?? "medio";
  },

  set dificuldade(id) {
    this.dados.dificuldade = id;
    gravar(this.dados);
  },

  recorde(faseId, difId) {
    return this.dados.recordes?.[faseId]?.[difId] ?? null;
  },

  concluir(indiceFase, faseId, difId, tempo) {
    this.dados.desbloqueadas = Math.max(this.dados.desbloqueadas, indiceFase + 2);
    this.dados.recordes ??= {};
    this.dados.recordes[faseId] ??= {};
    const anterior = this.dados.recordes[faseId][difId];
    const novo = anterior == null || tempo < anterior;
    if (novo) this.dados.recordes[faseId][difId] = tempo;
    gravar(this.dados);
    return novo;
  },
};

export function formatarTempo(seg) {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
