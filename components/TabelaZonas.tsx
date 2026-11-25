import { TESTES, calcularZonas, mmss, type Teste } from "@/lib/zonas";

// Tabela das zonas de treino do atleta (pace e velocidade por zona).
export function TabelaZonas({ teste, tempoS }: { teste: Teste; tempoS: number }) {
  const r = calcularZonas(teste, tempoS);
  const kmh = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return (
    <div style={{ overflowX: "auto" }}>
      <p className="regra" style={{ marginBottom: 8 }}>
        {TESTES[teste].nome}: {mmss(tempoS)} · ritmo médio <b>{mmss(r.paceTeste)}/km</b> ({kmh(r.kmh)} km/h)
      </p>
      <table className="tabela zonas-tabela">
        <thead><tr><th>Zona</th><th>Intensidade</th><th>Pace (min/km)</th><th>Velocidade</th><th>% do teste</th></tr></thead>
        <tbody>
          {r.zonas.map((z) => (
            <tr key={z.n} className={`zona-${z.n}`}>
              <td><span className="zona-num">Z{z.n}</span></td>
              <td><b>{z.nome}</b></td>
              <td className="zona-pace">{mmss(z.paceLento)} a {mmss(z.paceRapido)}</td>
              <td>{kmh(z.kmhMin)} a {kmh(z.kmhMax)} km/h</td>
              <td className="regra">{z.min}–{z.max}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
