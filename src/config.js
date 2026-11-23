export const DIFICULDADES = {
  facil: {
    id: "facil",
    nome: "Fácil",
    descricao: "Borracha lenta e tinta de sobra.",
    velBorracha: 3.6,
    esperaBorracha: 3.5,
    tintaMax: 150,
    tintaInicial: 150,
    frasco: 60,
    reembolsoDesfazer: 1,
  },
  medio: {
    id: "medio",
    nome: "Médio",
    descricao: "O equilíbrio pensado para o jogo.",
    velBorracha: 4.6,
    esperaBorracha: 2.5,
    tintaMax: 100,
    tintaInicial: 100,
    frasco: 50,
    reembolsoDesfazer: 0.5,
  },
  dificil: {
    id: "dificil",
    nome: "Difícil",
    descricao: "Borracha rápida e a tinta exata para terminar.",
    velBorracha: 5.6,
    esperaBorracha: 2,
    tintaExata: true,
    reembolsoDesfazer: 1,
  },
};

export const VIDAS = 3;
export const CUSTO_TINTA_POR_UNIDADE = 4;

export function tintaDaFase(def, dif) {
  const qtdFrascos = def.frascos.length;
  if (dif.tintaExata) {
    const { inicial, frascos } = def.dificil;
    const max = Math.max(inicial, ...frascos.map((f) => f + inicial));
    return { inicial, max: Math.max(max, 40), frascos: def.frascos.map((_, i) => frascos[i] ?? 0) };
  }
  return { inicial: dif.tintaInicial, max: dif.tintaMax, frascos: new Array(qtdFrascos).fill(dif.frasco) };
}
