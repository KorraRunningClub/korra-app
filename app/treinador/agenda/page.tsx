import Link from "next/link";
import { redirect } from "next/navigation";
import type React from "react";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { hojeSP } from "@/lib/semana";
import { DIAS_SEMANA, MESES, somarDias, TIPOS_EVENTO, type Evento } from "@/lib/calendario";
import { HORA_FIM, HORA_INI, TIPOS_AGENDA, emFaixas, hhmm, minutos, type ItemAgenda } from "@/lib/agenda";
import { PLANOS, SITUACOES, diasPara, fimDoPlano, type AlunoPersonal } from "@/lib/personal";

export const metadata = { title: "Minha agenda · Korrá Running Club" };

const OK: Record<string, string> = {
  criado: "Horário adicionado.", serie: "Horários adicionados (toda semana).", salvo: "Horário atualizado.", apagado: "Horário apagado.",
  personal_criado: "Aluno de personal adicionado.", personal_salvo: "Aluno atualizado.", personal_pago: "Pagamento registrado.",
  personal_renovado: "Plano renovado para o próximo período.", personal_apagado: "Aluno removido.",
};
const ERRO: Record<string, string> = { personal: "Confira nome, plano, valor e data de início.", dados: "Confira o título, a data e os horários (o fim precisa ser depois do início).", tabela: "A agenda ainda está sendo ligada (falta rodar o SQL no Supabase).", salvar: "Não conseguimos salvar. Tente de novo." };

const segundaDe = (d: string) => somarDias(d, -((new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7));
const br = (d: string) => d.split("-").reverse().slice(0, 2).join("/");
const TOTAL = (HORA_FIM - HORA_INI) * 60;
const pos = (ini: string, fim: string) => {
  const a = Math.max(0, minutos(ini) - HORA_INI * 60), b = Math.min(TOTAL, minutos(fim) - HORA_INI * 60);
  return { top: `${(a / TOTAL) * 100}%`, height: `${Math.max(2.2, ((b - a) / TOTAL) * 100)}%` };
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; item?: string; novo?: string; hora?: string; editar?: string; aluno?: string; ok?: string; erro?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/agenda");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;
  const q = await searchParams;
  const hoje = hojeSP();
  const seg = /^\d{4}-\d{2}-\d{2}$/.test(q.semana ?? "") ? segundaDe(q.semana!) : segundaDe(hoje);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(seg, i));
  const dom = dias[6];

  const [{ data: it }, { data: ev }, { data: pa }] = await Promise.all([
    supabase.from("agenda_itens").select("id, tipo, titulo, data, hora_inicio, hora_fim, local, obs, grupo, personal_id").gte("data", seg).lte("data", dom).order("hora_inicio"),
    supabase.from("eventos").select("id, tipo, titulo, data, hora_inicio, hora_fim, local_nome, endereco, descricao, prova_id, grupo").gte("data", seg).lte("data", dom),
    supabase.from("personal_alunos").select("id, nome, telefone, plano, valor, inicio, fim, pago, pago_em, situacao, obs").order("nome"),
  ]);
  const alunosP = (pa ?? []) as AlunoPersonal[];
  const ordemSit = { ativo: 0, pausado: 1, cancelado: 2 } as const;
  const listaP = [...alunosP].sort((a, b) => ordemSit[a.situacao] - ordemSit[b.situacao] || a.fim.localeCompare(b.fim));
  const ativosP = alunosP.filter((a) => a.situacao === "ativo");
  const mensalEquiv = ativosP.reduce((t, a) => t + (PLANOS[a.plano].meses ? Number(a.valor) / PLANOS[a.plano].meses : 0), 0);
  const aReceber = ativosP.filter((a) => !a.pago).reduce((t, a) => t + Number(a.valor), 0);
  const vencendo = ativosP.filter((a) => diasPara(a.fim, hoje) <= 7).length;
  const alunoEditando = q.aluno && q.aluno !== "novo" ? alunosP.find((a) => a.id === q.aluno) ?? null : null;
  const alunoNovo = q.aluno === "novo";
  const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dbr = (d: string | null) => (d ? d.split("-").reverse().join("/") : "—");
  const itens = (it ?? []) as ItemAgenda[];
  const eventos = ((ev ?? []) as Evento[]).filter((e) => e.hora_inicio);
  const base = `/treinador/agenda?semana=${seg}`;
  let aberto = itens.find((i) => i.id === q.item) ?? null;
  if (!aberto && q.item) {
    const { data } = await supabase.from("agenda_itens").select("id, tipo, titulo, data, hora_inicio, hora_fim, local, obs, grupo").eq("id", q.item).maybeSingle();
    aberto = (data as ItemAgenda) ?? null;
  }
  const editando = q.editar ? itens.find((i) => i.id === q.editar) ?? null : null;
  const novoDia = q.novo && /^\d{4}-\d{2}-\d{2}$/.test(q.novo) ? q.novo : null;
  const novaHora = /^\d{2}:\d{2}$/.test(q.hora ?? "") ? q.hora! : "07:00";
  const fimPadrao = (h: string) => `${String(Math.min(23, Number(h.slice(0, 2)) + 1)).padStart(2, "0")}:${h.slice(3, 5)}`;

  // resumo da semana
  const horasPor = Object.fromEntries(Object.keys(TIPOS_AGENDA).map((k) => [k, 0])) as Record<string, number>;
  for (const i of itens) horasPor[i.tipo] += (minutos(i.hora_fim) - minutos(i.hora_inicio)) / 60;
  const totalHoras = Object.values(horasPor).reduce((a, b) => a + b, 0);
  const fmtH = (h: number) => `${Math.floor(h)}h${Math.round((h % 1) * 60) ? String(Math.round((h % 1) * 60)).padStart(2, "0") : ""}`;

  const [a1, m1] = seg.split("-").map(Number);
  const titulo = seg.slice(0, 7) === dom.slice(0, 7) ? `${MESES[m1 - 1]} ${a1}` : `${br(seg)} a ${br(dom)}`;
  const horas = Array.from({ length: HORA_FIM - HORA_INI }, (_, i) => HORA_INI + i);

  const form = (i: ItemAgenda | null, dia: string, hora: string) => (
    <form action="/treinador/agenda/acao" method="post" className="evento-form">
      <input type="hidden" name="acao" value={i ? "editar" : "criar"} />
      {i && <input type="hidden" name="id" value={i.id} />}
      <input type="hidden" name="semana" value={seg} />
      <div className="field"><label htmlFor="ag-tipo">Tipo</label>
        <select id="ag-tipo" name="tipo" defaultValue={i?.tipo ?? "personal"}>
          {Object.entries(TIPOS_AGENDA).map(([k, t]) => <option key={k} value={k}>{t.nome}</option>)}
        </select>
      </div>
      {ativosP.length > 0 && (
        <div className="field"><label htmlFor="ag-al">Aluno de personal (opcional)</label>
          <select id="ag-al" name="personal_id" defaultValue={(i as (ItemAgenda & { personal_id?: string | null }) | null)?.personal_id ?? ""}>
            <option value="">Nenhum</option>
            {ativosP.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
      )}
      <div className="field"><label htmlFor="ag-tit">Título {ativosP.length > 0 && "(se escolher o aluno, pode deixar em branco)"}</label><input id="ag-tit" name="titulo" maxLength={120} defaultValue={i?.titulo ?? ""} placeholder="Ex.: Personal · Maria" /></div>
      <div className="linha-campos">
        <div className="field"><label htmlFor="ag-data">Data</label><input id="ag-data" name="data" type="date" required defaultValue={i?.data ?? dia} /></div>
        <div className="field"><label htmlFor="ag-hi">Início</label><input id="ag-hi" name="hora_inicio" type="time" required defaultValue={i ? hhmm(i.hora_inicio) : hora} /></div>
        <div className="field"><label htmlFor="ag-hf">Fim</label><input id="ag-hf" name="hora_fim" type="time" required defaultValue={i ? hhmm(i.hora_fim) : fimPadrao(hora)} /></div>
      </div>
      <div className="field"><label htmlFor="ag-loc">Local</label><input id="ag-loc" name="local" maxLength={120} defaultValue={i?.local ?? ""} placeholder="Ex.: Academia X, Parque de Coqueiros" /></div>
      <div className="field"><label htmlFor="ag-obs">Observações</label><textarea id="ag-obs" name="obs" rows={3} maxLength={1000} defaultValue={i?.obs ?? ""} /></div>
      {!i && (
        <div className="field"><label htmlFor="ag-rep">Repetir</label>
          <select id="ag-rep" name="repetir" defaultValue="1">
            <option value="1">Não repetir</option>
            {[4, 8, 12, 16, 26, 52].map((n) => <option key={n} value={n}>Toda semana, por {n} semanas</option>)}
          </select>
        </div>
      )}
      <div className="evento-form-acoes">
        <button className="btn btn-primary" type="submit">{i ? "Salvar" : "Adicionar"}</button>
        <Link className="btn-link" href={base}>Cancelar</Link>
      </div>
    </form>
  );


  const formAluno = (a: AlunoPersonal | null) => (
    <form action="/treinador/personal/acao" method="post" className="evento-form">
      <input type="hidden" name="acao" value={a ? "editar" : "criar"} />
      {a && <input type="hidden" name="id" value={a.id} />}
      <input type="hidden" name="semana" value={seg} />
      <div className="field"><label htmlFor="pa-nome">Nome do aluno</label><input id="pa-nome" name="nome" required maxLength={100} defaultValue={a?.nome ?? ""} /></div>
      <div className="field"><label htmlFor="pa-tel">WhatsApp (opcional)</label><input id="pa-tel" name="telefone" inputMode="tel" maxLength={20} defaultValue={a?.telefone ?? ""} /></div>
      <div className="linha-campos">
        <div className="field"><label htmlFor="pa-plano">Plano</label>
          <select id="pa-plano" name="plano" defaultValue={a?.plano ?? "mensal"}>{Object.entries(PLANOS).map(([k, p]) => <option key={k} value={k}>{p.nome}</option>)}</select>
        </div>
        <div className="field"><label htmlFor="pa-valor">Valor do plano (R$)</label><input id="pa-valor" name="valor" inputMode="decimal" required defaultValue={a ? String(a.valor).replace(".", ",") : ""} placeholder="ex.: 600,00" /></div>
        <div className="field"><label htmlFor="pa-sit">Situação</label>
          <select id="pa-sit" name="situacao" defaultValue={a?.situacao ?? "ativo"}>{Object.entries(SITUACOES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        </div>
      </div>
      <div className="linha-campos" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="field"><label htmlFor="pa-ini">Início</label><input id="pa-ini" name="inicio" type="date" required defaultValue={a?.inicio ?? hoje} /></div>
        <div className="field"><label htmlFor="pa-fim">Fim</label><input id="pa-fim" name="fim" type="date" defaultValue={a?.fim ?? ""} /></div>
      </div>
      <label className="check-linha"><input type="checkbox" name="fim_auto" value="1" defaultChecked={!a} /> Calcular o fim pelo plano (mensal +1 mês, trimestral +3, semestral +6, anual +12)</label>
      <div className="linha-campos" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <label className="check-linha"><input type="checkbox" name="pago" value="1" defaultChecked={a?.pago ?? false} /> Já pagou</label>
        <div className="field"><label htmlFor="pa-pg">Data do pagamento</label><input id="pa-pg" name="pago_em" type="date" defaultValue={a?.pago_em ?? ""} /></div>
      </div>
      <div className="field"><label htmlFor="pa-obs">Observações</label><textarea id="pa-obs" name="obs" rows={2} maxLength={500} defaultValue={a?.obs ?? ""} /></div>
      <div className="evento-form-acoes">
        <button className="btn btn-primary" type="submit">{a ? "Salvar" : "Adicionar aluno"}</button>
        <Link className="btn-link" href={`${base}#financeiro`}>Cancelar</Link>
      </div>
    </form>
  );

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Só você vê</div>
          <h1 style={{ marginTop: 14 }}>Minha agenda</h1>
          {q.ok && <p className="msg" style={{ marginTop: 16 }}>{OK[q.ok] ?? "Pronto."}</p>}
          {q.erro && <p className="msg erro" style={{ marginTop: 16 }}>{ERRO[q.erro] ?? "Algo deu errado."}</p>}

          <div className="cal-nav">
            <Link href={`/treinador/agenda?semana=${somarDias(seg, -7)}`} aria-label="Semana anterior">←</Link>
            <h2 style={{ textTransform: "capitalize" }}>{titulo}</h2>
            <Link href={`/treinador/agenda?semana=${somarDias(seg, 7)}`} aria-label="Próxima semana">→</Link>
            {seg !== segundaDe(hoje) && <Link className="cal-hoje" href="/treinador/agenda">Hoje</Link>}
            <Link className="btn btn-primary ag-novo" href={`${base}&novo=${dias.includes(hoje) ? hoje : seg}`}>+ Novo horário</Link>
          </div>
          <div className="ag-resumo">
            <span><b>{fmtH(totalHoras)}</b> na semana</span>
            {Object.entries(TIPOS_AGENDA).map(([k, t]) => horasPor[k] > 0 && (
              <span key={k}><i className={`ponto ${t.cor}`} />{t.nome}: {fmtH(horasPor[k])}</span>
            ))}
            {eventos.length > 0 && <span><i className="ponto ag-evento" />Eventos da assessoria</span>}
          </div>

          <div className="ag-scroll">
            <div className="ag">
              <div className="ag-canto" />
              {dias.map((d, i) => (
                <div key={d} className={`ag-dia-cab${d === hoje ? " hoje" : ""}`}>
                  <span>{DIAS_SEMANA[i]}</span><b>{Number(d.slice(8))}</b>
                </div>
              ))}
              <div className="ag-horas">
                {horas.map((h) => <span key={h} style={{ top: `${((h - HORA_INI) * 60 / TOTAL) * 100}%` }}>{String(h).padStart(2, "0")}h</span>)}
              </div>
              {dias.map((d) => {
                const doDia = emFaixas(itens.filter((i) => i.data === d));
                return (
                  <div key={d} className={`ag-col${d === hoje ? " hoje" : ""}`}>
                    {horas.map((h) => (
                      <Link key={h} className="ag-slot" href={`${base}&novo=${d}&hora=${String(h).padStart(2, "0")}:00`}
                        style={{ top: `${((h - HORA_INI) * 60 / TOTAL) * 100}%`, height: `${(60 / TOTAL) * 100}%` }} aria-label={`Novo horário ${d} ${h}h`} />
                    ))}
                    {eventos.filter((e) => e.data === d).map((e) => (
                      <Link key={e.id} className="ag-item ag-evento" href={`/aluno/calendario?mes=${d.slice(0, 7)}&evento=${e.id}`}
                        style={pos(e.hora_inicio!, e.hora_fim ?? `${String(Number(e.hora_inicio!.slice(0, 2)) + 1).padStart(2, "0")}:00`)} title={TIPOS_EVENTO[e.tipo].nome}>
                        <b>{hhmm(e.hora_inicio!)}</b> {e.titulo}
                      </Link>
                    ))}
                    {doDia.map(({ item: i, faixa, faixas }) => (
                      <Link key={i.id} className={`ag-item ${TIPOS_AGENDA[i.tipo].cor}`} href={`${base}&item=${i.id}`}
                        style={{ ...pos(i.hora_inicio, i.hora_fim), left: `calc(${(faixa / faixas) * 100}% + 2px)`, width: `calc(${100 / faixas}% - 4px)` } as React.CSSProperties}>
                        <b>{hhmm(i.hora_inicio)}–{hhmm(i.hora_fim)}</b>
                        <span>{i.titulo}</span>
                        {i.local && <small>{i.local}</small>}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="regra" style={{ marginTop: 10 }}>Clique num horário vazio para adicionar. Os eventos da assessoria aparecem tracejados.</p>

          <section id="financeiro" style={{ marginTop: 56 }}>
            <div className="fin-topo">
              <h2 className="sub-provas">Controle financeiro · Personal</h2>
              <Link className="btn btn-primary" href={`${base}&aluno=novo#financeiro`}>+ Aluno de personal</Link>
            </div>
            <div className="grid-cards" style={{ marginTop: 14 }}>
              <div className="tile"><span className="k">Alunos ativos</span><span className="v">{ativosP.length}</span><span>{alunosP.length - ativosP.length} pausados ou cancelados</span></div>
              <div className="tile"><span className="k">Receita por mês</span><span className="v">{reais(mensalEquiv)}</span><span>planos ativos divididos por mês</span></div>
              <div className="tile"><span className="k">A receber</span><span className="v">{reais(aReceber)}</span><span>planos ativos ainda não pagos</span></div>
              <div className="tile"><span className="k">Vencendo em 7 dias</span><span className="v">{vencendo}</span><span>avisamos 1 dia antes em Mensagens</span></div>
            </div>
            {listaP.length === 0 ? (
              <p className="msg" style={{ marginTop: 16 }}>Nenhum aluno de personal ainda. Clique em “+ Aluno de personal”.</p>
            ) : (
              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table className="tabela fin-tabela">
                  <thead><tr><th>Aluno</th><th>Plano</th><th>Valor</th><th>Início</th><th>Fim</th><th>Pagamento</th><th>Situação</th><th></th></tr></thead>
                  <tbody>
                    {listaP.map((a) => {
                      const d = diasPara(a.fim, hoje);
                      return (
                        <tr key={a.id} className={a.situacao !== "ativo" ? "inativo" : undefined}>
                          <td><b>{a.nome}</b>{a.telefone && <><br /><a className="regra" href={`https://wa.me/55${a.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></>}</td>
                          <td>{PLANOS[a.plano].nome}</td>
                          <td>{reais(Number(a.valor))}</td>
                          <td>{dbr(a.inicio)}</td>
                          <td>
                            {dbr(a.fim)}
                            {a.situacao === "ativo" && <span className={`vence ${d < 0 ? "vencido" : d <= 1 ? "urgente" : d <= 7 ? "logo" : ""}`}>{d < 0 ? `venceu há ${-d}d` : d === 0 ? "vence hoje" : d === 1 ? "vence amanhã" : `em ${d} dias`}</span>}
                          </td>
                          <td>
                            <form action="/treinador/personal/acao" method="post">
                              <input type="hidden" name="acao" value="pago" /><input type="hidden" name="id" value={a.id} /><input type="hidden" name="semana" value={seg} />
                              <input type="hidden" name="pago" value={a.pago ? "0" : "1"} />
                              <button className={`pg ${a.pago ? "ok" : "pendente"}`} type="submit" title={a.pago ? "Clique para marcar como pendente" : "Clique para marcar como pago hoje"}>
                                {a.pago ? `Pago ${dbr(a.pago_em).slice(0, 5)}` : "Pendente"}
                              </button>
                            </form>
                          </td>
                          <td>
                            <form action="/treinador/personal/acao" method="post" className="sit-form">
                              <input type="hidden" name="acao" value="situacao" /><input type="hidden" name="id" value={a.id} /><input type="hidden" name="semana" value={seg} />
                              <select name="situacao" defaultValue={a.situacao} className={`sit ${a.situacao}`} aria-label="Situação">
                                {Object.entries(SITUACOES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                              </select>
                              <button className="btn-link" type="submit">ok</button>
                            </form>
                          </td>
                          <td className="fin-acoes">
                            <Link className="btn-link" href={`${base}&aluno=${a.id}#financeiro`}>Editar</Link>
                            {a.plano !== "avulso" && (
                              <form action="/treinador/personal/acao" method="post">
                                <input type="hidden" name="acao" value="renovar" /><input type="hidden" name="id" value={a.id} /><input type="hidden" name="semana" value={seg} />
                                <button className="btn-link" type="submit" title={`Novo período: ${dbr(a.fim)} a ${dbr(fimDoPlano(a.fim, a.plano))}`}>Renovar</button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {aberto && !editando && (
          <div className="modal-fundo">
            <Link className="modal-fora" href={base} aria-label="Fechar" />
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ag-titulo">
              <Link className="modal-x" href={base} aria-label="Fechar">×</Link>
              <span className={`agenda-tipo ${TIPOS_AGENDA[aberto.tipo].cor}`}>{TIPOS_AGENDA[aberto.tipo].nome}</span>
              <h2 id="ag-titulo">{aberto.titulo}</h2>
              <p className="ev-quando">
                <b>{new Date(`${aberto.data}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</b> · {hhmm(aberto.hora_inicio)} às {hhmm(aberto.hora_fim)}
              </p>
              {aberto.local && (
                <p>📍 {aberto.local} · <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(aberto.local)}`} target="_blank" rel="noopener noreferrer">abrir no Maps ↗</a></p>
              )}
              {aberto.obs && <p className="ev-desc">{aberto.obs}</p>}
              <div className="ev-admin">
                <Link className="btn btn-ghost" href={`${base}&editar=${aberto.id}`}>Editar</Link>
                <form action="/treinador/agenda/acao" method="post">
                  <input type="hidden" name="acao" value="apagar" /><input type="hidden" name="id" value={aberto.id} /><input type="hidden" name="semana" value={seg} />
                  <button className="btn-link" type="submit">Apagar este</button>
                </form>
                {aberto.grupo && (
                  <form action="/treinador/agenda/acao" method="post">
                    <input type="hidden" name="acao" value="apagar_serie" /><input type="hidden" name="id" value={aberto.id} /><input type="hidden" name="semana" value={seg} />
                    <button className="btn-link" type="submit">Apagar este e os próximos</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
        {(alunoNovo || alunoEditando) && (
          <div className="modal-fundo">
            <Link className="modal-fora" href={`${base}#financeiro`} aria-label="Fechar" />
            <div className="modal" role="dialog" aria-modal="true" aria-label={alunoEditando ? "Editar aluno" : "Novo aluno de personal"}>
              <Link className="modal-x" href={`${base}#financeiro`} aria-label="Fechar">×</Link>
              <h2>{alunoEditando ? "Editar aluno" : "Novo aluno de personal"}</h2>
              {formAluno(alunoEditando)}
              {alunoEditando && (
                <form action="/treinador/personal/acao" method="post" style={{ borderTop: "1.5px solid var(--line)", paddingTop: 12 }}>
                  <input type="hidden" name="acao" value="apagar" /><input type="hidden" name="id" value={alunoEditando.id} /><input type="hidden" name="semana" value={seg} />
                  <button className="btn-link" type="submit">Remover aluno (apaga o histórico dele)</button>
                </form>
              )}
            </div>
          </div>
        )}
        {(novoDia || editando) && (
          <div className="modal-fundo">
            <Link className="modal-fora" href={base} aria-label="Fechar" />
            <div className="modal" role="dialog" aria-modal="true" aria-label={editando ? "Editar horário" : "Novo horário"}>
              <Link className="modal-x" href={base} aria-label="Fechar">×</Link>
              <h2>{editando ? "Editar horário" : "Novo horário"}</h2>
              {form(editando, novoDia ?? hoje, novaHora)}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
