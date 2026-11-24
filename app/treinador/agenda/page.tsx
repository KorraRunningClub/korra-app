import Link from "next/link";
import { redirect } from "next/navigation";
import type React from "react";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { hojeSP } from "@/lib/semana";
import { DIAS_SEMANA, MESES, somarDias, TIPOS_EVENTO, type Evento } from "@/lib/calendario";
import { HORA_FIM, HORA_INI, TIPOS_AGENDA, emFaixas, hhmm, minutos, type ItemAgenda } from "@/lib/agenda";

export const metadata = { title: "Minha agenda · Korrá Running Club" };

const OK: Record<string, string> = { criado: "Horário adicionado.", serie: "Horários adicionados (toda semana).", salvo: "Horário atualizado.", apagado: "Horário apagado." };
const ERRO: Record<string, string> = { dados: "Confira o título, a data e os horários (o fim precisa ser depois do início).", tabela: "A agenda ainda está sendo ligada (falta rodar o SQL no Supabase).", salvar: "Não conseguimos salvar. Tente de novo." };

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
  searchParams: Promise<{ semana?: string; item?: string; novo?: string; hora?: string; editar?: string; ok?: string; erro?: string }>;
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

  const [{ data: it }, { data: ev }] = await Promise.all([
    supabase.from("agenda_itens").select("id, tipo, titulo, data, hora_inicio, hora_fim, local, obs, grupo").gte("data", seg).lte("data", dom).order("hora_inicio"),
    supabase.from("eventos").select("id, tipo, titulo, data, hora_inicio, hora_fim, local_nome, endereco, descricao, prova_id, grupo").gte("data", seg).lte("data", dom),
  ]);
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
      <div className="field"><label htmlFor="ag-tit">Título</label><input id="ag-tit" name="titulo" required maxLength={120} defaultValue={i?.titulo ?? ""} placeholder="Ex.: Personal · Maria" /></div>
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
