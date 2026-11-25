import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { TabelaZonas } from "@/components/TabelaZonas";
import { hojeSP } from "@/lib/semana";
import { TESTES, mmss, type Teste } from "@/lib/zonas";

export const metadata = { title: "Zonas de treino · Korrá Running Club" };

type T = { id: string; user_id: string; teste: Teste; data: string; tempo_s: number; obs: string | null };
const OK: Record<string, string> = { salvo: "Teste salvo e zonas geradas. O aluno já pode ver.", apagado: "Teste apagado." };
const ERRO: Record<string, string> = { dados: "Confira o teste, a data e o tempo (ex.: 6:12 ou 1:05:30).", tabela: "Falta rodar o SQL das zonas no Supabase.", salvar: "Não conseguimos salvar. Tente de novo." };

export default async function ZonasTreinador({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/zonas");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;
  const { ok, erro } = await searchParams;
  const hoje = hojeSP();

  const [{ data: alunos }, { data: testes }] = await Promise.all([
    supabase.from("perfis").select("id, nome").eq("papel", "aluno").eq("status", "ativo").order("nome"),
    supabase.from("testes_zonas").select("id, user_id, teste, data, tempo_s, obs").order("data", { ascending: false }).order("criado_em", { ascending: false }),
  ]);
  const porAluno = new Map<string, T[]>();
  for (const t of (testes ?? []) as T[]) porAluno.set(t.user_id, [...(porAluno.get(t.user_id) ?? []), t]);
  const dbr = (d: string) => d.split("-").reverse().join("/");

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Painel do treinador</div>
          <h1 style={{ marginTop: 14 }}>Zonas de treino</h1>
          <p style={{ marginTop: 12, maxWidth: 760 }}>
            Escolha o teste que o aluno fez e coloque o <b>tempo total</b> ou o <b>pace médio</b>. As zonas são geradas na hora com o
            modelo da Korrá e aparecem para o aluno em <b>Minha área → Minhas zonas</b>.
          </p>
          <details className="gerenciar" style={{ marginTop: 14 }}>
            <summary>Ver os modelos (% da velocidade do teste)</summary>
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table className="tabela">
                <thead><tr><th>Zona</th>{Object.values(TESTES).map((t) => <th key={t.nome}>{t.curto}</th>)}</tr></thead>
                <tbody>
                  {TESTES.t1600.zonas.map((z, i) => (
                    <tr key={z.n}><td><b>Z{z.n} · {z.nome}</b></td>{Object.values(TESTES).map((t) => <td key={t.nome}>{t.zonas[i].min}–{t.zonas[i].max}%</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          {ok && <p className="msg" style={{ marginTop: 16 }}>{OK[ok] ?? "Pronto."}</p>}
          {erro && <p className="msg erro" style={{ marginTop: 16 }}>{ERRO[erro] ?? "Algo deu errado."}</p>}

          <div className="zonas-lista">
            {(alunos ?? []).map((a) => {
              const hist = porAluno.get(a.id) ?? [];
              const ultimo = hist[0];
              return (
                <section key={a.id} id={`a-${a.id}`} className="zona-card">
                  <div className="zona-card-topo">
                    <a className="ciclo-aluno nome-atleta" href={`/treinador/aluno/${a.id}`}>{a.nome ?? "Aluno"}</a>
                    <span className="regra">{ultimo ? `${TESTES[ultimo.teste].curto} · ${mmss(ultimo.tempo_s)} · ${dbr(ultimo.data)}` : "sem teste"}</span>
                  </div>
                  {ultimo && (
                    <details>
                      <summary>Ver zonas atuais</summary>
                      <div style={{ marginTop: 10 }}><TabelaZonas teste={ultimo.teste} tempoS={ultimo.tempo_s} /></div>
                    </details>
                  )}
                  <details open={!ultimo}>
                    <summary>{ultimo ? "Lançar novo teste" : "Lançar teste"}</summary>
                    <form action="/treinador/zonas/acao" method="post" className="zona-form">
                      <input type="hidden" name="user_id" value={a.id} />
                      <div className="field"><label htmlFor={`t-${a.id}`}>Teste</label>
                        <select id={`t-${a.id}`} name="teste" defaultValue={ultimo?.teste ?? "t3000"}>
                          {Object.entries(TESTES).map(([k, t]) => <option key={k} value={k}>{t.nome}</option>)}
                        </select>
                      </div>
                      <div className="field"><label htmlFor={`d-${a.id}`}>Data</label><input id={`d-${a.id}`} name="data" type="date" defaultValue={hoje} max={hoje} required /></div>
                      <fieldset className="field cat-escolha"><legend>Vou informar</legend>
                        <label><input type="radio" name="modo" value="tempo" defaultChecked /> Tempo total</label>
                        <label><input type="radio" name="modo" value="pace" /> Pace médio (min/km)</label>
                      </fieldset>
                      <div className="field"><label htmlFor={`v-${a.id}`}>Tempo ou pace</label><input id={`v-${a.id}`} name="valor" required placeholder="ex.: 12:45 ou 4:15" inputMode="numeric" /></div>
                      <div className="field"><label htmlFor={`o-${a.id}`}>Observação (opcional)</label><input id={`o-${a.id}`} name="obs" maxLength={300} placeholder="ex.: pista, calor, vento" /></div>
                      <button className="btn btn-primary" type="submit">Gerar zonas</button>
                    </form>
                  </details>
                  {hist.length > 0 && (
                    <details>
                      <summary>Histórico de testes ({hist.length})</summary>
                      <ul className="lista-remover">
                        {hist.map((t) => (
                          <li key={t.id}>
                            <span>{dbr(t.data)} · {TESTES[t.teste].curto} · {mmss(t.tempo_s)} ({mmss(t.tempo_s / (TESTES[t.teste].metros / 1000))}/km){t.obs ? ` · ${t.obs}` : ""}</span>
                            <form action="/treinador/zonas/acao" method="post">
                              <input type="hidden" name="acao" value="apagar" /><input type="hidden" name="id" value={t.id} /><input type="hidden" name="user_id" value={a.id} />
                              <button className="btn-link" type="submit">apagar</button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
