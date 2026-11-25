import { TESTES, calcularZonas, mmss, type Teste } from "@/lib/zonas";

// Zonas de treino do atleta pelo VDOT (pace e velocidade por zona) + VDOT e VO2máx estimado.
export function TabelaZonas({ teste, tempoS }: { teste: Teste; tempoS: number }) {
  const r = calcularZonas(teste, tempoS);
  const kmh = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return (
    <div>
      <div className="zonas-numeros">
        <div><span className="ms-num">{num(r.vdot)}</span><span className="ms-rot">VDOT</span></div>
        <div><span className="ms-num">{mmss(r.vvo2)}</span><span className="ms-rot">vVO2máx (min/km)</span></div>
        <div><span className="ms-num">{num(r.vo2)}</span><span className="ms-rot">VO2máx estimado (ml/kg/min)</span></div>
      </div>
      <p className="regra" style={{ margin: "12px 0 8px" }}>
        {TESTES[teste].nome}: {mmss(tempoS)} · ritmo médio {mmss(r.paceTeste)}/km ({kmh(r.kmh)} km/h)
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="tabela zonas-tabela">
          <thead><tr><th>Zona</th><th>Intensidade</th><th>Pace (min/km)</th><th>Velocidade</th><th>% do VDOT</th></tr></thead>
          <tbody>
            {r.zonas.map((z) => (
              <tr key={z.n} className={`zona-${z.n}`}>
                <td><span className="zona-num">Z{z.n}</span></td>
                <td><b>{z.nome}</b>{z.daniels && <span className="regra"> ({z.daniels})</span>}<br /><span className="regra">{z.uso}</span></td>
                <td className="zona-pace">{mmss(z.paceLento)} a {mmss(z.paceRapido)}</td>
                <td>{kmh(z.kmhMin)} a {kmh(z.kmhMax)} km/h</td>
                <td className="regra">{z.min}–{z.max}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
