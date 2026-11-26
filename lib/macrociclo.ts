// Bases do MACROCICLO da Korrá (referência só do treinador).
// "Potência aeróbia" da fase 3 = VO2máx. Q1, Q2, Q3 = os treinos de qualidade da semana.
export const FASES_MACRO = [
  { n: "I", titulo: "Base 1", objetivo: "Fortalecimento muscular e articular (prevenção). Adaptações cardiovasculares.",
    curta: ["Corrida fácil / tiros curtos"], maratona: ["Corrida fácil / tiros curtos"] },
  { n: "II", titulo: "Base 2", objetivo: "Mecânica de corrida, endurance no limiar.",
    curta: ["Reps / subida", "Limiar", "Interval"], maratona: ["Reps / interval", "Limiar", "Longo ou longo/limiar"] },
  { n: "III", titulo: "Transição", objetivo: "Endurance no limiar, potência aeróbia (VO2máx), economia de movimento. Transição para a qualidade final.",
    curta: ["Interval", "Subida / reps", "Longo"], maratona: ["Interval ou limiar/longo", "Limiar", "Ritmo de maratona"] },
  { n: "IV", titulo: "Qualidade final", objetivo: "Qualidade final do treinamento, testes, tomada de tempo, previsão e estimativa de resultado, mentalização.",
    curta: ["Limiar", "Interval / reps", "Reps / interval"], maratona: ["Limiar / ritmo de maratona", "Limiar / longo", "Ritmo de maratona / longo"] },
] as const;

/** Até 15 km usa a coluna 5K–15K; a partir da meia maratona, a coluna Maratona. */
export const colunaDaProva = (km: number | null | undefined) => ((km ?? 0) > 15 ? "maratona" : "curta");
