import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { TabelaZonas } from "@/components/TabelaZonas";
import { hojeSP, pace } from "@/lib/semana";
import { TESTES, calcularZonas, mmss, velocidadeCritica, vdot, type Teste } from "@/lib/zonas";

export const metadata = { title: "Atleta · Korrá Running Club" };

type T = { id: string; teste: Teste; data: string; tempo_s: number; obs: string | null; atividade_id: number | null };
type A = { id: number; inicio_local: string; nome: string | null; distancia_m: number; tempo_mov_s: number; tempo_total_s: number };
const OK: Record<string, string> = { salvo: "Teste salvo. As zonas e o progresso foram atualizados.", apagado: "Teste apagado." };
const ERRO: Record<string, string> = { dados: "Confira o teste, a data e o tempo (ex.: 6:12 ou 1:05:30).", tabela: "Falta rodar o SQL no Supabase.", salvar: "Não conseguimos salvar. Tente de novo." };
const CORES: Record<Teste, string> = { t1600: "#E8622C", t2400: "#7B57A6", t3000: "#3E6FB0", t5000: "#4E8A4A" };
const dbr = (d: string) => d.slice(0, 10).split("-").reverse().join("/");

/** Teste provável pela distância da atividade (±12%). */
function testePorDistancia(m: number): Teste | null {
  for (const [k, t] of Object.entries(TESTES)) if (Math.abs(m - t.metros) / t.metros <= 0.12) return k as Teste;
  return null;
}

function Grafico({ testes }: { testes: T[] }) {
  const pts = testes.map((t) => ({ ...t, ts: Date.parse(`${t.data}T12:00:00Z`), p: t.tempo_s / (TESTES[t.teste].metros / 1000) }));
  if (pts.length < 2) return null;
  const W = 640, H = 220, M = { l: 52, r: 16, t: 16, b: 28 };
  const x0 = Math.min(...pts.map((p) => p.ts)), x1 = Math.max(...pts.map((p) => p.ts)) || x0 + 1;
  const pMin = Math.min(...pts.map((p) => p.p)), pMax = Math.max(...pts.map((p) => p.p));
  const folga = Math.max(5, (pMax - pMin) * 0.15);
  const y0 = pMin - folga, y1 = pMax + folga;
  const X = (ts: number) => M.l + ((ts - x0) / (x1 - x0 || 1)) * (W - M.l - M.r);
  const Y = (p: number) => M.t + ((p - y0) / (y1 - y0)) * (H - M.t - M.b); // pace menor (mais rápido) fica em cima
  const ticks = [0, 0.5, 1].map((f) => y0 + f * (y1 - y0));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="grafico-testes" role="img" aria-label="Evolução do pace nos testes (mais rápido em cima)">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} stroke="currentColor" strokeOpacity=".12" />
          <text x={M.l - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity=".6">{mmss(t)}</text>
        </g>
      ))}
      {(Object.keys(TESTES) as Teste[]).map((k) => {
        const s = pts.filter((p) => p.teste === k).sort((a, b) => a.ts - b.ts);
        if (!s.length) return null;
        return (
          <g key={k}>
            {s.length > 1 && <polyline fill="none" stroke={CORES[k]} strokeWidth="2.5" points={s.map((p) => `${X(p.ts)},${Y(p.p)}`).join(" ")} />}
            {s.map((p) => (
              <g key={p.id}>
                <circle cx={X(p.ts)} cy={Y(p.p)} r="5" fill={CORES[k]} stroke="#fff" strokeWidth="1.5" />
                <title>{`${TESTES[k].curto} · ${dbr(p.data)} · ${mmss(p.tempo_s)} (${mmss(p.p)}/km)`}</title>
              </g>
            ))}
          </g>
        );
      })}
      <text x={M.l} y={H - 8} fontSize="11" fill="currentColor" opacity=".6">{dbr(new Date(x0).toISOString())}</text>
      <text x={W - M.r} y={H - 8} fontSize="11" textAnchor="end" fill="currentColor" opacity=".6">{dbr(new Date(x1).toISOString())}</text>
    </svg>
  );
}

export default async function AtletaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aba?: string; ok?: string; erro?: string; teste_de?: string }> }) {
  const sessao = await getSessao();
  const { id } = await params;
  if (!sessao) redirect(`/entrar?voltar=/treinador/aluno/${id}`);
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;
  const q = await searchParams;
  const aba = q.aba === "progresso" ? "progresso" : q.aba === "atividades" ? "atividades" : "zonas";
  const hoje = hojeSP();
  const base = `/treinador/aluno/${id}`;

  const [{ data: aluno }, { data: tz }, { data: atv }, { data: marcadas }] = await Promise.all([
    supabase.from("perfis").select("id, nome, email, status, objetivo").eq("id", id).maybeSingle(),
    supabase.from("testes_zonas").select("id, teste, data, tempo_s, obs, atividade_id").eq("user_id", id).order("data", { ascending: false }).order("criado_em", { ascending: false }),
    supabase.from("atividades").select("id, inicio_local, nome, distancia_m, tempo_mov_s, tempo_total_s").eq("user_id", id).order("inicio_local", { ascending: false }).limit(30),
    supabase.from("treino_marcacoes").select("atividade_id").eq("user_id", id).eq("tipo", "teste"),
  ]);
  const alunoMarcou = new Set((marcadas ?? []).map((m) => Number(m.atividade_id)));
  if (!aluno) notFound();
  const testes = (tz ?? []) as T[];
  const atividades = (atv ?? []) as A[];
  const atual = testes[0];
  const jaTeste = new Map(testes.filter((t) => t.atividade_id).map((t) => [Number(t.atividade_id), t]));
  const marcando = q.teste_de ? atividades.find((a) => String(a.id) === q.teste_de) ?? null : null;

  const formTeste = (a: A | null) => {
    const sug = a ? testePorDistancia(Number(a.distancia_m)) : null;
    return (
      <form action="/treinador/zonas/acao" method="post" className="zona-form">
        <input type="hidden" name="user_id" value={id} />
        <input type="hidden" name="voltar" value={`${base}?aba=${a ? "atividades" : "zonas"}`} />
        {a && <input type="hidden" name="atividade_id" value={a.id} />}
        <div className="field"><label htmlFor="ft-teste">Teste</label>
          <select id="ft-teste" name="teste" defaultValue={sug ?? atual?.teste ?? "t3000"}>
            {Object.entries(TESTES).map(([k, t]) => <option key={k} value={k}>{t.nome}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="ft-data">Data</label><input id="ft-data" name="data" type="date" required max={hoje} defaultValue={a ? a.inicio_local.slice(0, 10) : hoje} /></div>
        <fieldset className="field cat-escolha"><legend>Vou informar</legend>
          <label><input type="radio" name="modo" value="tempo" defaultChecked /> Tempo total do teste</label>
          <label><input type="radio" name="modo" value="pace" /> Pace médio (min/km)</label>
        </fieldset>
        <div className="field"><label htmlFor="ft-valor">Tempo ou pace</label>
          <input id="ft-valor" name="valor" required inputMode="numeric" placeholder="ex.: 12:45 ou 4:15" defaultValue={a && sug ? mmss(a.tempo_mov_s) : ""} />
        </div>
        <div className="field"><label htmlFor="ft-obs">Observação</label><input id="ft-obs" name="obs" maxLength={300} placeholder="ex.: pista, calor, vento" /></div>
        {a && (
          <p className="regra" style={{ gridColumn: "1/-1" }}>
            Atividade do Strava: {(Number(a.distancia_m) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km em {mmss(a.tempo_mov_s)}.
            {sug ? " Preenchi o tempo com o da atividade; ajuste se o teste foi só um trecho dela." : " A distância não bate com nenhum teste: digite o tempo do trecho do teste."}
          </p>
        )}
        <button className="btn btn-primary" type="submit">Salvar teste e gerar zonas</button>
      </form>
    );
  };

  // velocidade crítica: teste mais recente + outro de distância diferente feito até 30 dias antes/depois
  let vc: { vc: number; pace: number; dLinha: number; a: T; b: T } | null = null;
  if (atual) {
    const par = testes.find((t) => TESTES[t.teste].metros !== TESTES[atual.teste].metros &&
      Math.abs(Date.parse(t.data) - Date.parse(atual.data)) <= 30 * 86400000);
    if (par) {
      const r = velocidadeCritica({ metros: TESTES[atual.teste].metros, tempoS: atual.tempo_s }, { metros: TESTES[par.teste].metros, tempoS: par.tempo_s });
      if (r) vc = { ...r, a: atual, b: par };
    }
  }
  const z4 = atual ? calcularZonas(atual.teste, atual.tempo_s).zonas[3] : null;

  // progresso: comparações por tipo de teste
  const porTipo = (Object.keys(TESTES) as Teste[]).map((k) => {
    const lista = testes.filter((t) => t.teste === k).sort((a, b) => a.data.localeCompare(b.data));
    return { k, lista };
  }).filter((g) => g.lista.length);

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <Link className="voltar-loja" href="/treinador">← Painel</Link>
          <div className="eyebrow" style={{ marginTop: 14 }}>Atleta</div>
          <h1 style={{ marginTop: 10 }}>{aluno.nome ?? aluno.email}</h1>
          <p className="regra" style={{ marginTop: 6 }}>{aluno.objetivo ?? ""}{atual ? ` · último teste: ${TESTES[atual.teste].curto} em ${dbr(atual.data)}` : " · sem teste ainda"}</p>
          {q.ok && <p className="msg" style={{ marginTop: 14 }}>{OK[q.ok] ?? "Pronto."}</p>}
          {q.erro && <p className="msg erro" style={{ marginTop: 14 }}>{ERRO[q.erro] ?? "Algo deu errado."}</p>}

          <div className="forum-abas" role="tablist" style={{ marginTop: 20 }}>
            {[["zonas", "Zonas de treino"], ["progresso", "Progresso"], ["atividades", "Atividades do Strava"]].map(([k, n]) => (
              <Link key={k} href={`${base}?aba=${k}`} role="tab" aria-selected={aba === k} className={`forum-aba${aba === k ? " ativa" : ""}`}>{n}</Link>
            ))}
          </div>

          {aba === "zonas" && (
            <section style={{ marginTop: 24 }}>
              {atual ? (
                <>
                  <div className="zonas-destaque"><TabelaZonas teste={atual.teste} tempoS={atual.tempo_s} /></div>
                  <div className="vc-caixa">
                    <b>Velocidade crítica</b>
                    {vc && z4 ? (
                      <>
                        <p>
                          <span className="zona-pace">{mmss(vc.pace)}/km</span> ({(vc.vc * 3.6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km/h) · D&apos; = {Math.round(vc.dLinha)} m ·
                          com {TESTES[vc.a.teste].curto} ({mmss(vc.a.tempo_s)}) e {TESTES[vc.b.teste].curto} ({mmss(vc.b.tempo_s)})
                        </p>
                        <p className="regra">
                          Z4 pelo VDOT: {mmss(z4.paceLento)} a {mmss(z4.paceRapido)}/km.{" "}
                          {vc.pace < z4.paceRapido - 10 ? "A VC está mais de 10 s/km mais rápida que a Z4: vale rever o teste ou subir a Z4 desse atleta."
                            : vc.pace > z4.paceLento + 10 ? "A VC está mais de 10 s/km mais lenta que a Z4: vale rever o teste ou baixar a Z4 desse atleta."
                            : "A VC confirma o limiar calculado pelo VDOT."}
                        </p>
                      </>
                    ) : (
                      <p className="regra">Aparece quando houver dois testes de distâncias diferentes com até 30 dias entre eles (ex.: 1600 m e 5 km).</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="msg">Nenhum teste ainda. Lance abaixo ou marque uma atividade do Strava como teste.</p>
              )}
              <details className="gerenciar" style={{ marginTop: 18 }} open={!atual}>
                <summary>Lançar teste manualmente</summary>
                {formTeste(null)}
              </details>
            </section>
          )}

          {aba === "progresso" && (
            <section style={{ marginTop: 24 }}>
              {testes.length === 0 ? (
                <p className="msg">Ainda não há testes para comparar.</p>
              ) : (
                <>
                  <div className="grafico-caixa">
                    <div className="cal-legenda">
                      {porTipo.map((g) => <span key={g.k}><i className="ponto" style={{ background: CORES[g.k] }} />{TESTES[g.k].curto}</span>)}
                      <span className="regra">· pace médio do teste (mais rápido em cima)</span>
                    </div>
                    <Grafico testes={testes} />
                  </div>
                  {porTipo.map((g) => {
                    const prim = g.lista[0];
                    return (
                      <div key={g.k} style={{ marginTop: 22 }}>
                        <h2 className="sub-provas">{TESTES[g.k].nome}</h2>
                        <div style={{ overflowX: "auto", marginTop: 10 }}>
                          <table className="tabela">
                            <thead><tr><th>Data</th><th>Tempo</th><th>Pace</th><th>VDOT</th><th>vs. anterior</th><th>vs. 1º teste</th><th>Origem</th><th></th></tr></thead>
                            <tbody>
                              {[...g.lista].reverse().map((t, i, arr) => {
                                const ant = arr[i + 1];
                                const dif = (a?: T) => {
                                  if (!a) return "—";
                                  const d = t.tempo_s - a.tempo_s;
                                  const pct = ((a.tempo_s - t.tempo_s) / a.tempo_s) * 100;
                                  return <span className={d < 0 ? "melhorou" : d > 0 ? "piorou" : ""}>{d === 0 ? "igual" : `${d < 0 ? "−" : "+"}${mmss(Math.abs(d))} (${pct > 0 ? "+" : ""}${pct.toFixed(1)}%)`}</span>;
                                };
                                return (
                                  <tr key={t.id}>
                                    <td>{dbr(t.data)}</td>
                                    <td><b>{mmss(t.tempo_s)}</b></td>
                                    <td>{mmss(t.tempo_s / (TESTES[t.teste].metros / 1000))}/km</td>
                                    <td>{vdot(TESTES[t.teste].metros, t.tempo_s).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}</td>
                                    <td>{dif(ant)}</td>
                                    <td>{t.id === prim.id ? "—" : dif(prim)}</td>
                                    <td>{t.atividade_id ? <a className="ver-strava" href={`https://www.strava.com/activities/${t.atividade_id}`} target="_blank" rel="noopener noreferrer">View on Strava</a> : "manual"}</td>
                                    <td>
                                      <form action="/treinador/zonas/acao" method="post">
                                        <input type="hidden" name="acao" value="apagar" /><input type="hidden" name="id" value={t.id} />
                                        <input type="hidden" name="user_id" value={id} /><input type="hidden" name="voltar" value={`${base}?aba=progresso`} />
                                        <button className="btn-link" type="submit">apagar</button>
                                      </form>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                  <p className="regra" style={{ marginTop: 12 }}>Tempo negativo (verde) = mais rápido que o teste comparado.</p>
                </>
              )}
            </section>
          )}

          {aba === "atividades" && (
            <section style={{ marginTop: 24 }}>
              <p className="regra">Últimas corridas do Strava do atleta. Se alguma foi um teste, clique em <b>“Foi um teste”</b>: vira teste, gera as zonas e entra no progresso.</p>
              {atividades.length === 0 ? (
                <p className="msg" style={{ marginTop: 14 }}>Nenhuma corrida importada (o atleta precisa conectar o Strava).</p>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 14 }}>
                  <table className="tabela">
                    <thead><tr><th>Data</th><th>Treino</th><th>Distância</th><th>Tempo</th><th>Pace</th><th></th></tr></thead>
                    <tbody>
                      {atividades.map((a) => {
                        const t = jaTeste.get(Number(a.id));
                        const sug = testePorDistancia(Number(a.distancia_m));
                        return (
                          <tr key={a.id} className={t ? "linha-teste" : undefined}>
                            <td>{dbr(a.inicio_local)} {a.inicio_local.slice(11, 16)}</td>
                            <td>
                              {a.nome ?? "Corrida"}
                              {alunoMarcou.has(Number(a.id)) && !t && <span className="pill teste-aluno" style={{ marginLeft: 8 }}>aluno marcou como teste</span>}
                              {sug && !t && <span className="pill" style={{ marginLeft: 8 }}>parece {TESTES[sug].curto}</span>}
                            </td>
                            <td>{(Number(a.distancia_m) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km</td>
                            <td>{mmss(a.tempo_mov_s)}</td>
                            <td>{pace(a.tempo_mov_s / (Number(a.distancia_m) / 1000))}</td>
                            <td>{t ? <b>Teste {TESTES[t.teste].curto} ✓</b> : <Link className="btn-link" href={`${base}?aba=atividades&teste_de=${a.id}#marcar`}>Foi um teste</Link>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {marcando && (
                <div id="marcar" className="panel" style={{ marginTop: 18, maxWidth: 720 }}>
                  <h2 className="sub-provas">Marcar como teste: {marcando.nome ?? "Corrida"} · {dbr(marcando.inicio_local)}</h2>
                  {formTeste(marcando)}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
