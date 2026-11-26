import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CicloProgresso } from "@/components/CicloProgresso";
import { hojeSP } from "@/lib/semana";
import { ajustesTexto, calcularCiclo, inicioPadrao } from "@/lib/ciclo";
import { diasAte, nomeDistancia, type Prova } from "@/lib/provas";
import { MICROCICLOS, TIPOS_QUALIDADE, type SessaoQualidade } from "@/lib/microciclos";

export const metadata = { title: "Ciclos das provas-alvo · Korrá Running Club" };

type Linha = {
  id: string; user_id: string; ciclo_semanas: number | null; ciclo_inicio: string | null; ciclo_meta: number | null;
  ciclo_ajustes: Record<string, number> | null; ciclo_micros: Record<string, string> | null; provas: Prova; perfis: { nome: string | null } | null;
};

const OK: Record<string, string> = { salvo: "Ciclo salvo.", removido: "Ciclo removido." };
const ERRO: Record<string, string> = { dados: "Confira semanas (1 a 52) e treinos por semana (1 a 14).", salvar: "Não conseguimos salvar. Tente de novo." };

export default async function CiclosPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/ciclos");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;
  const { ok, erro } = await searchParams;
  const hoje = hojeSP();

  const { data } = await supabase
    .from("prova_inscricoes")
    .select("id, user_id, ciclo_semanas, ciclo_inicio, ciclo_meta, ciclo_ajustes, ciclo_micros, provas!inner(id, nome, data, distancia, distancia_km, cidade, link), perfis(nome)")
    .eq("categoria", "alvo").eq("status", "inscrito").gte("provas.data", hoje);
  const linhas = ((data ?? []) as unknown as Linha[]).sort((a, b) => a.provas.data.localeCompare(b.provas.data));

  // treinos (corridas + extras) de todos esses alunos desde o início mais antigo
  const ids = [...new Set(linhas.map((l) => l.user_id))];
  const desde = linhas.map((l) => l.ciclo_inicio ?? inicioPadrao(l.provas.data, l.ciclo_semanas ?? 12)).sort()[0] ?? hoje;
  const porAluno = new Map<string, string[]>();
  const qualidadePor = new Map<string, SessaoQualidade[]>();
  if (ids.length) {
    const [{ data: atv }, { data: ex }, { data: mq }] = await Promise.all([
      supabase.from("atividades").select("user_id, inicio_local").in("user_id", ids).gte("inicio_local", `${desde}T00:00:00`),
      supabase.from("treinos_extras").select("user_id, data").in("user_id", ids).gte("data", desde),
      supabase.from("treino_marcacoes").select("user_id, data").in("user_id", ids).in("tipo", [...TIPOS_QUALIDADE]).gte("data", desde),
    ]);
    for (const m of mq ?? []) qualidadePor.set(m.user_id, [...(qualidadePor.get(m.user_id) ?? []), { data: m.data as string }]);
    for (const a of atv ?? []) porAluno.set(a.user_id, [...(porAluno.get(a.user_id) ?? []), String(a.inicio_local).slice(0, 10)]);
    for (const e of ex ?? []) porAluno.set(e.user_id, [...(porAluno.get(e.user_id) ?? []), e.data as string]);
  }

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Painel do treinador</div>
          <h1 style={{ marginTop: 14 }}>Ciclos das provas-alvo</h1>
          <p style={{ marginTop: 12, maxWidth: 720 }}>
            Para cada aluno com prova-alvo, defina quantas semanas tem o ciclo e quantos treinos por semana ele precisa fazer.
            O início é calculado sozinho (o ciclo termina no dia da prova), mas você pode mudar. Para semanas diferentes, use os
            ajustes, por exemplo <b>11:3, 12:3</b> (semanas 11 e 12 com 3 treinos).
          </p>
          {ok && <p className="msg" style={{ marginTop: 16 }}>{OK[ok] ?? "Pronto."}</p>}
          {erro && <p className="msg erro" style={{ marginTop: 16 }}>{ERRO[erro] ?? "Algo deu errado."}</p>}

          <details className="micro-ref" style={{ marginTop: 20 }}>
            <summary>Microciclos e treinos de qualidade</summary>
            <div style={{ overflowX: "auto" }}><table className="tabela micro-tabela">
              <thead><tr><th>Microciclo</th><th>Qualidade</th><th>Regra</th></tr></thead>
              <tbody>
                {Object.entries(MICROCICLOS).map(([k, m]) => (
                  <tr key={k}><td><span className={`micro-tag micro-${k}`}>{m.nome}</span></td><td>{m.qMin === m.qMax ? m.qMin : `${m.qMin} a ${m.qMax}`}</td><td>{m.regra}</td></tr>
                ))}
              </tbody>
            </table></div>
            <p style={{ marginTop: 8, fontSize: 14 }}>Conta como qualidade a corrida que o aluno marcar como <b>Intervalado</b>, <b>Fartlek</b> ou <b>Teste</b> (prova não conta).</p>
          </details>

          {linhas.length === 0 ? (
            <p className="msg" style={{ marginTop: 24 }}>Nenhum aluno com prova-alvo ainda. Quando eles adicionarem em Calendário → Provas, aparecem aqui.</p>
          ) : (
            <div className="ciclos-lista">
              {linhas.map((l) => {
                const temCiclo = Boolean(l.ciclo_semanas && l.ciclo_meta);
                const semanas = l.ciclo_semanas ?? 12;
                const cfg = { semanas, inicio: l.ciclo_inicio, meta: l.ciclo_meta ?? 5, ajustes: l.ciclo_ajustes, dataProva: l.provas.data, micros: l.ciclo_micros };
                const ader = temCiclo ? calcularCiclo(cfg, porAluno.get(l.user_id) ?? [], hoje).aderencia : null;
                return (
                  <div key={l.id} className={`ciclo-card${temCiclo ? "" : " sem"}`}>
                    <div className="ciclo-card-topo">
                      <div>
                        <a className="ciclo-aluno nome-atleta" href={`/treinador/aluno/${l.user_id}`}>{l.perfis?.nome ?? "Aluno"}</a>
                        <span className="prova-info">{l.provas.nome} · {l.provas.data.split("-").reverse().join("/")} · {nomeDistancia(l.provas)} · faltam {diasAte(l.provas.data, hoje)} dias</span>
                      </div>
                      {temCiclo ? <span className={`ader-badge ${ader === null ? "neutra" : ader >= 85 ? "otima" : ader >= 65 ? "boa" : "baixa"}`}>{ader === null ? "—" : `${ader}%`}</span> : <span className="ader-badge neutra">sem ciclo</span>}
                    </div>
                    {temCiclo && <CicloProgresso config={cfg} treinos={porAluno.get(l.user_id) ?? []} hoje={hoje} claro qualidade={qualidadePor.get(l.user_id) ?? []} />}
                    <details open={!temCiclo}>
                      <summary>{temCiclo ? "Editar ciclo" : "Configurar ciclo"}</summary>
                      <form action="/treinador/ciclos/acao" method="post" className="ciclo-form">
                        <input type="hidden" name="acao" value="salvar" /><input type="hidden" name="id" value={l.id} />
                        <div className="field"><label htmlFor={`s-${l.id}`}>Semanas</label><input id={`s-${l.id}`} name="semanas" type="number" min={1} max={52} defaultValue={semanas} required /></div>
                        <div className="field"><label htmlFor={`m-${l.id}`}>Treinos/semana</label><input id={`m-${l.id}`} name="meta" type="number" min={1} max={14} defaultValue={l.ciclo_meta ?? 5} required /></div>
                        <div className="field"><label htmlFor={`i-${l.id}`}>Início (opcional)</label><input id={`i-${l.id}`} name="inicio" type="date" defaultValue={l.ciclo_inicio ?? ""} /></div>
                        <div className="field"><label htmlFor={`a-${l.id}`}>Ajustes por semana</label><input id={`a-${l.id}`} name="ajustes" defaultValue={ajustesTexto(l.ciclo_ajustes)} placeholder="ex.: 11:3, 12:3" /></div>
                        <fieldset className="micro-grade">
                          <legend>Microciclo de cada semana</legend>
                          {Array.from({ length: semanas }, (_, i) => (
                            <label key={i} className="micro-sel">
                              <span>Sem. {i + 1}</span>
                              <select name={`micro_${i + 1}`} defaultValue={l.ciclo_micros?.[String(i + 1)] ?? ""}>
                                <option value="">—</option>
                                {Object.entries(MICROCICLOS).map(([k, m]) => <option key={k} value={k}>{m.nome}</option>)}
                              </select>
                            </label>
                          ))}
                          <small>Mudou o nº de semanas? Salve uma vez e as novas semanas aparecem aqui.</small>
                        </fieldset>
                        <button className="btn btn-primary" type="submit">Salvar ciclo</button>
                      </form>
                      {temCiclo && (
                        <form action="/treinador/ciclos/acao" method="post" style={{ marginTop: 8 }}>
                          <input type="hidden" name="acao" value="remover" /><input type="hidden" name="id" value={l.id} />
                          <button className="btn-link" type="submit">Remover ciclo</button>
                        </form>
                      )}
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
