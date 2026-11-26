"use client";
import { useState } from "react";

// Limites de carga por semana (fração do volume total).
export const LIMITES = [
  { id: "limiar", nome: "Limiar (Z4)", pct: 10, cor: "#FED261" },
  { id: "vo2", nome: "VO2máx (Z5)", pct: 10, cor: "#F08A5D" },
  { id: "rep", nome: "Repetição (Z6)", pct: 5, cor: "#B9A6F2" },
] as const;

const km = (v: number) => (Math.round(v * 10) / 10).toLocaleString("pt-BR");

export function GraficoCarga() {
  const [nome, setNome] = useState("Arthur");
  const [total, setTotal] = useState(30);
  const t = Math.max(0, total);
  const facil = t * (1 - LIMITES.reduce((s, l) => s + l.pct, 0) / 100);
  return (
    <div className="carga">
      <div className="carga-entrada">
        <label>Atleta <input value={nome} onChange={(e) => setNome(e.target.value)} /></label>
        <label>Volume da semana (km)
          <input type="number" min={5} max={200} step={1} value={total} onChange={(e) => setTotal(Number(e.target.value) || 0)} />
        </label>
        <input type="range" min={10} max={120} step={1} value={t} onChange={(e) => setTotal(Number(e.target.value))} aria-label="Volume da semana" />
      </div>

      <p className="carga-frase"><b>{nome || "Atleta"}</b> corre <b>{km(t)} km</b> na semana. No máximo:</p>

      <div className="carga-barra" role="img" aria-label={`Distribuição de ${km(t)} km`}>
        <span className="carga-seg facil" style={{ flexGrow: facil }}>{facil >= t * 0.3 ? `Fácil / aeróbico · ${km(facil)} km` : ""}</span>
        {LIMITES.map((l) => (
          <span key={l.id} className="carga-seg" style={{ flexGrow: (t * l.pct) / 100, background: l.cor }}>{km((t * l.pct) / 100)}</span>
        ))}
      </div>

      <ul className="carga-legenda">
        <li><i style={{ background: "#7ED07A" }} /> Fácil / aeróbico (Z1–Z3): o restante, <b>{km(facil)} km</b> ou mais</li>
        {LIMITES.map((l) => (
          <li key={l.id}><i style={{ background: l.cor }} /> {l.nome}: até <b>{km((t * l.pct) / 100)} km</b> ({l.pct}% de {km(t)} km)</li>
        ))}
      </ul>

      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <table className="tabela carga-tabela">
          <thead><tr><th>Volume semanal</th>{LIMITES.map((l) => <th key={l.id}>Máx. {l.nome}</th>)}</tr></thead>
          <tbody>
            {[20, 30, 40, 50, 60, 80].map((v) => (
              <tr key={v} className={v === t ? "ativa" : ""}><td><b>{v} km</b></td>{LIMITES.map((l) => <td key={l.id}>{km((v * l.pct) / 100)} km</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
