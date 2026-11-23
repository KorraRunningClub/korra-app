// Ícone do horário da corrida: sol (manhã/tarde), sol se pondo (entardecer), lua (noite).
// Usa a hora local de início da atividade (ex.: "2026-11-21T06:30:00").
export function periodoCorrida(inicioLocal: string) {
  const h = Number(inicioLocal.slice(11, 13));
  if (h >= 4 && h < 12) return { tipo: "sol", nome: "Corrida matinal" } as const;
  if (h >= 12 && h < 17) return { tipo: "sol", nome: "Corrida da tarde" } as const;
  if (h >= 17 && h < 20) return { tipo: "entardecer", nome: "Corrida ao entardecer" } as const;
  return { tipo: "lua", nome: "Corrida noturna" } as const;
}

export function IconeHorario({ inicioLocal }: { inicioLocal: string }) {
  const p = periodoCorrida(inicioLocal);
  const comum = {
    width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const, role: "img", "aria-label": p.nome, className: "icone-horario",
  };
  if (p.tipo === "sol")
    return (
      <svg {...comum}>
        <title>{p.nome}</title>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1" />
      </svg>
    );
  if (p.tipo === "entardecer")
    return (
      <svg {...comum}>
        <title>{p.nome}</title>
        <path d="M7.5 16a4.5 4.5 0 0 1 9 0M3 16h18M12 7v1.5M5.6 10.1l1.1 1M18.4 10.1l-1.1 1M8 19.5h8" />
      </svg>
    );
  return (
    <svg {...comum}>
      <title>{p.nome}</title>
      <path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10Z" />
    </svg>
  );
}
