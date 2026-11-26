import { calcularCiclo, corAderencia, type ConfigCiclo } from "@/lib/ciclo";
import { MICROCICLOS, conferirSemana, ehMicro, type SessaoQualidade } from "@/lib/microciclos";

const br = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

// As duas barras do ciclo (dias e "como estou para o desafio") + as semanas em quadradinhos.
export function CicloProgresso({ config, treinos, hoje, compacto = false, claro = false, qualidade = [] }: { config: ConfigCiclo; treinos: string[]; hoje: string; compacto?: boolean; claro?: boolean; qualidade?: SessaoQualidade[] }) {
  const c = calcularCiclo(config, treinos, hoje);
  const semanaTxt = !c.comecou
    ? `Começa em ${br(c.inicio)}`
    : c.atual ? `Semana ${c.atual.n} de ${c.semanas.length}` : `${c.semanas.length} semanas`;
  return (
    <div className={`ciclo${compacto ? " compacto" : ""}${claro ? " claro" : ""}`}>
      <div className="ciclo-linha">
        <div className="ciclo-rot"><b>Ciclo</b><span>{semanaTxt} · {c.faltam === 0 ? "é hoje!" : `faltam ${c.faltam} dias`}</span></div>
        <div className="ciclo-barra" role="progressbar" aria-valuenow={c.pctDias} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do ciclo">
          <span style={{ width: `${c.pctDias}%` }} />
        </div>
      </div>
      <div className="ciclo-linha">
        <div className="ciclo-rot"><b>Como estou para o desafio</b><span>{c.aderencia === null ? "conta a partir da 1ª semana fechada" : `${c.aderencia}%`}</span></div>
        <div className={`ciclo-barra aderencia ${corAderencia(c.aderencia)}`} role="progressbar" aria-valuenow={c.aderencia ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Como estou para o desafio">
          <span style={{ width: `${c.aderencia ?? 0}%` }} />
        </div>
      </div>
      {c.atual && (
        <p className="ciclo-semana">Esta semana: <b>{c.atual.feitos}/{c.atual.meta}</b> treinos{c.atual.feitos >= c.atual.meta ? " ✓" : ""}</p>
      )}
      {c.atual?.micro && ehMicro(c.atual.micro) && (() => {
        const m = MICROCICLOS[c.atual.micro];
        const q = conferirSemana(c.atual.micro, qualidade, c.atual.ini, c.atual.fim);
        return (
          <p className={`ciclo-micro micro-${c.atual.micro}`}>
            <span className="micro-tag">{m.nome}</span> Qualidade: <b>{q.feitas}/{q.meta}</b>
            {q.acima ? " · acima do previsto para este microciclo" : ""}
            {q.pertoDemais ? (m.intervaloDias >= 5 ? " · faltou o descanso de 4 dias entre os testes" : " · menos de 48 h entre duas sessões") : ""}
            <br /><span className="micro-regra">{m.regra}</span>
          </p>
        );
      })()}
      {!compacto && (
        <div className="ciclo-semanas" aria-label="Semanas do ciclo">
          {c.semanas.map((s) => {
            const pct = s.meta ? Math.min(1, s.feitos / s.meta) : 1;
            const cls = s.estado === "futura" ? "futura" : pct >= 1 ? "cheia" : pct >= 0.6 ? "media" : s.estado === "atual" ? "atual" : "fraca";
            return (
              <span key={s.n} className={`ciclo-sem ${cls}${s.estado === "atual" ? " agora" : ""}`}
                title={`Semana ${s.n} (${br(s.ini)}–${br(s.fim)}): ${s.feitos}/${s.meta}${s.micro && ehMicro(s.micro) ? ` · ${MICROCICLOS[s.micro].nome}` : ""}`}>
                {s.n}
                {s.micro && ehMicro(s.micro) && <i className={`micro-pt micro-${s.micro}`}>{MICROCICLOS[s.micro].curto}</i>}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
