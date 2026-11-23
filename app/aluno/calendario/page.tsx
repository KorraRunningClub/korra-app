import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { hojeSP } from "@/lib/semana";
import { DIAS_SEMANA, MESES, TIPOS_EVENTO, gradeDoMes, horario, linkMaps, mapaEmbed, mesVizinho, type Evento } from "@/lib/calendario";
import { nomeDistancia, type Prova } from "@/lib/provas";

export const metadata = { title: "Calendário · Korrá Running Club" };

const OK: Record<string, string> = {
  criado: "Evento criado no calendário.",
  serie: "Eventos criados (repetindo toda semana).",
  salvo: "Evento atualizado.",
  apagado: "Evento apagado.",
};
const ERRO: Record<string, string> = {
  tipo: "Escolha o tipo do evento.",
  titulo: "Dê um título ao evento.",
  data: "Confira a data.",
  permissao: "Só o treinador pode mexer no calendário.",
  tabela: "O calendário ainda está sendo ligado (falta rodar o SQL no Supabase).",
  salvar: "Não conseguimos salvar. Tente de novo.",
};

const porExtenso = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; evento?: string; novo?: string; editar?: string; ok?: string; erro?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/calendario");
  const { supabase, user, perfil } = sessao;
  const treinador = perfil?.papel === "treinador";
  const liberado = perfil?.status === "ativo" || treinador;
  const q = await searchParams;
  const hoje = hojeSP();
  const mes = /^\d{4}-\d{2}$/.test(q.mes ?? "") ? q.mes! : hoje.slice(0, 7);
  const g = gradeDoMes(mes);
  const [ano, m] = mes.split("-").map(Number);

  let eventos: Evento[] = [];
  let provas: Prova[] = [];
  let minhasProvas = new Set<string>();
  if (liberado) {
    const [{ data: ev }, { data: pv }, { data: ins }] = await Promise.all([
      supabase.from("eventos").select("id, tipo, titulo, data, hora_inicio, hora_fim, local_nome, endereco, descricao, prova_id, grupo")
        .gte("data", g.inicio).lte("data", g.fim).order("data").order("hora_inicio", { nullsFirst: true }),
      supabase.from("provas").select("id, nome, data, distancia, distancia_km, cidade, link").gte("data", hoje).order("data"),
      supabase.from("prova_inscricoes").select("prova_id").eq("user_id", user.id),
    ]);
    eventos = (ev ?? []) as Evento[];
    provas = (pv ?? []) as Prova[];
    minhasProvas = new Set((ins ?? []).map((i) => i.prova_id as string));
  }
  const porDia = new Map<string, Evento[]>();
  for (const e of eventos) porDia.set(e.data, [...(porDia.get(e.data) ?? []), e]);
  const doMes = eventos.filter((e) => e.data >= g.primeiro && e.data <= g.ultimo);

  // evento aberto pode ser de outro mês (link direto)
  let aberto = eventos.find((e) => e.id === q.evento) ?? null;
  if (!aberto && q.evento && liberado) {
    const { data } = await supabase.from("eventos").select("id, tipo, titulo, data, hora_inicio, hora_fim, local_nome, endereco, descricao, prova_id, grupo").eq("id", q.evento).maybeSingle();
    aberto = (data as Evento) ?? null;
  }
  const editando = treinador && q.editar ? (eventos.find((e) => e.id === q.editar) ?? null) : null;
  const novoDia = treinador && q.novo && /^\d{4}-\d{2}-\d{2}$/.test(q.novo) ? q.novo : null;
  const provaDoEvento = aberto?.prova_id ? provas.find((p) => p.id === aberto!.prova_id) ?? null : null;
  const fechar = `/aluno/calendario?mes=${mes}`;

  const formEvento = (e: Evento | null, dia: string) => (
    <form action="/aluno/calendario/acao" method="post" className="evento-form">
      <input type="hidden" name="acao" value={e ? "editar" : "criar"} />
      {e && <input type="hidden" name="id" value={e.id} />}
      <input type="hidden" name="mes" value={mes} />
      <div className="field"><label htmlFor="ev-tipo">Tipo</label>
        <select id="ev-tipo" name="tipo" defaultValue={e?.tipo ?? "coletivo"}>
          {Object.entries(TIPOS_EVENTO).map(([k, t]) => <option key={k} value={k}>{t.nome}</option>)}
        </select>
      </div>
      <div className="field"><label htmlFor="ev-tit">Título</label><input id="ev-tit" name="titulo" required maxLength={120} defaultValue={e?.titulo ?? ""} placeholder="Ex.: Treino coletivo na Pedra Branca" /></div>
      <div className="linha-campos">
        <div className="field"><label htmlFor="ev-data">Data</label><input id="ev-data" name="data" type="date" required defaultValue={e?.data ?? dia} /></div>
        <div className="field"><label htmlFor="ev-hi">Início</label><input id="ev-hi" name="hora_inicio" type="time" defaultValue={e?.hora_inicio?.slice(0, 5) ?? ""} /></div>
        <div className="field"><label htmlFor="ev-hf">Fim</label><input id="ev-hf" name="hora_fim" type="time" defaultValue={e?.hora_fim?.slice(0, 5) ?? ""} /></div>
      </div>
      <div className="field"><label htmlFor="ev-loc">Local</label><input id="ev-loc" name="local_nome" maxLength={120} defaultValue={e?.local_nome ?? ""} placeholder="Ex.: Pedra Branca, em frente ao lago" /></div>
      <div className="field"><label htmlFor="ev-end">Endereço (para abrir no Google Maps)</label><input id="ev-end" name="endereco" maxLength={250} defaultValue={e?.endereco ?? ""} placeholder="Ex.: R. das Baronesas, 663 - Pedra Branca, Palhoça - SC" /></div>
      <div className="field"><label htmlFor="ev-desc">Como vai funcionar</label><textarea id="ev-desc" name="descricao" rows={4} maxLength={2000} defaultValue={e?.descricao ?? ""} placeholder="Aquecimento, treino do dia, o que levar..." /></div>
      <div className="field"><label htmlFor="ev-prova">Prova ligada (só para &quot;Prova oficial&quot;)</label>
        <select id="ev-prova" name="prova_id" defaultValue={e?.prova_id ?? ""}>
          <option value="">Nenhuma</option>
          {provas.map((p) => <option key={p.id} value={p.id}>{p.data.split("-").reverse().join("/")} · {p.nome} · {nomeDistancia(p)}</option>)}
        </select>
      </div>
      {!e && (
        <div className="field"><label htmlFor="ev-rep">Repetir</label>
          <select id="ev-rep" name="repetir" defaultValue="1">
            <option value="1">Não repetir</option>
            {[4, 8, 12, 16, 26].map((n) => <option key={n} value={n}>Toda semana, por {n} semanas</option>)}
          </select>
        </div>
      )}
      <div className="evento-form-acoes">
        <button className="btn btn-primary" type="submit">{e ? "Salvar alterações" : "Criar evento"}</button>
        <Link className="btn-link" href={e ? `${fechar}&evento=${e.id}` : fechar}>Cancelar</Link>
      </div>
    </form>
  );

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={treinador} />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Calendário Korrá</div>
          <h1 style={{ marginTop: 14 }}>Calendário da assessoria</h1>
          <p style={{ marginTop: 12, maxWidth: 680 }}>
            Treinos coletivos, encontros e as provas oficiais da Korrá. Clique em um evento para ver como vai funcionar e onde vai ser.
            {treinador && " Para criar, clique no + do dia."}
          </p>
          {q.ok && <p className="msg" style={{ marginTop: 16 }}>{OK[q.ok] ?? "Pronto."}</p>}
          {q.erro && <p className="msg erro" style={{ marginTop: 16 }}>{ERRO[q.erro] ?? "Algo deu errado."}</p>}

          {!liberado ? (
            <p className="msg" style={{ marginTop: 24 }}>O calendário libera assim que sua matrícula estiver ativa.</p>
          ) : (
            <>
              <div className="cal-nav">
                <Link href={`/aluno/calendario?mes=${mesVizinho(mes, -1)}`} aria-label="Mês anterior">←</Link>
                <h2>{MESES[m - 1]} <span>{ano}</span></h2>
                <Link href={`/aluno/calendario?mes=${mesVizinho(mes, 1)}`} aria-label="Próximo mês">→</Link>
                {mes !== hoje.slice(0, 7) && <Link className="cal-hoje" href="/aluno/calendario">Hoje</Link>}
              </div>
              <div className="cal-legenda">
                {Object.entries(TIPOS_EVENTO).map(([k, t]) => <span key={k}><i className={`ponto ${t.cor}`} />{t.nome}</span>)}
              </div>

              <div className="cal" role="grid" aria-label={`Calendário de ${MESES[m - 1]} de ${ano}`}>
                {DIAS_SEMANA.map((d) => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
                {g.dias.map((d) => {
                  const fora = d.slice(0, 7) !== mes;
                  const evs = porDia.get(d) ?? [];
                  return (
                    <div key={d} role="gridcell" className={`cal-dia${fora ? " fora" : ""}${d === hoje ? " hoje" : ""}${d < hoje ? " passado" : ""}`}>
                      <div className="cal-dia-topo">
                        <span className="cal-num">{Number(d.slice(8))}</span>
                        {treinador && <Link className="cal-mais" href={`/aluno/calendario?mes=${mes}&novo=${d}`} aria-label={`Criar evento em ${d}`}>+</Link>}
                      </div>
                      {evs.map((e) => (
                        <Link key={e.id} className={`cal-ev ${TIPOS_EVENTO[e.tipo].cor}`} href={`/aluno/calendario?mes=${mes}&evento=${e.id}`}>
                          {e.hora_inicio && <b>{e.hora_inicio.slice(0, 5)}</b>} <span>{e.titulo}</span>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>

              <h2 className="sub-provas" style={{ marginTop: 40 }}>Agenda de {MESES[m - 1]}</h2>
              {doMes.length === 0 ? (
                <p className="regra" style={{ marginTop: 8 }}>Nenhum evento neste mês ainda.</p>
              ) : (
                <ul className="agenda">
                  {doMes.map((e) => (
                    <li key={e.id} className={e.data < hoje ? "passado" : undefined}>
                      <Link href={`/aluno/calendario?mes=${mes}&evento=${e.id}`}>
                        <span className="agenda-data"><b>{Number(e.data.slice(8))}</b>{new Date(`${e.data}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "")}</span>
                        <span className="agenda-info">
                          <span className={`agenda-tipo ${TIPOS_EVENTO[e.tipo].cor}`}>{TIPOS_EVENTO[e.tipo].nome}</span>
                          <b>{e.titulo}</b>
                          <span className="regra">{[horario(e), e.local_nome].filter(Boolean).join(" · ")}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* janela do evento */}
        {aberto && !editando && (
          <div className="modal-fundo">
            <Link className="modal-fora" href={fechar} aria-label="Fechar" />
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ev-titulo">
              <Link className="modal-x" href={fechar} aria-label="Fechar">×</Link>
              <span className={`agenda-tipo ${TIPOS_EVENTO[aberto.tipo].cor}`}>{TIPOS_EVENTO[aberto.tipo].nome}</span>
              <h2 id="ev-titulo">{aberto.titulo}</h2>
              <p className="ev-quando"><b>{porExtenso(aberto.data)}</b>{horario(aberto) && ` · ${horario(aberto)}`}</p>
              {(aberto.local_nome || aberto.endereco) && (
                <div className="ev-local">
                  <p>📍 <b>{aberto.local_nome ?? aberto.endereco}</b>{aberto.local_nome && aberto.endereco ? <><br /><span className="regra">{aberto.endereco}</span></> : null}</p>
                  <a className="btn btn-ghost" href={linkMaps(aberto)!} target="_blank" rel="noopener noreferrer">Abrir no Google Maps ↗</a>
                  <iframe className="ev-mapa" src={mapaEmbed(aberto)!} title={`Mapa: ${aberto.local_nome ?? aberto.endereco}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              )}
              {aberto.descricao && <p className="ev-desc">{aberto.descricao}</p>}
              {provaDoEvento && (
                <div className="ev-prova-box">
                  <p><b>{provaDoEvento.nome}</b> · {nomeDistancia(provaDoEvento)}{provaDoEvento.cidade ? ` · ${provaDoEvento.cidade}` : ""}</p>
                  {minhasProvas.has(provaDoEvento.id) ? (
                    <Link className="btn-link" href="/aluno/provas">Já está nas suas provas ✓</Link>
                  ) : (
                    <form action="/aluno/provas/acao" method="post" className="ev-inscrever">
                      <input type="hidden" name="acao" value="inscrever" /><input type="hidden" name="prova_id" value={provaDoEvento.id} />
                      <select name="categoria" defaultValue="secundaria" aria-label="Categoria">
                        <option value="secundaria">Como secundária</option><option value="alvo">Como prova-alvo</option>
                      </select>
                      <button className="btn btn-primary" type="submit">Vou correr: adicionar às minhas provas</button>
                    </form>
                  )}
                </div>
              )}
              {treinador && (
                <div className="ev-admin">
                  <Link className="btn btn-ghost" href={`${fechar}&editar=${aberto.id}`}>Editar</Link>
                  <form action="/aluno/calendario/acao" method="post">
                    <input type="hidden" name="acao" value="apagar" /><input type="hidden" name="id" value={aberto.id} /><input type="hidden" name="mes" value={mes} />
                    <button className="btn-link" type="submit">Apagar este</button>
                  </form>
                  {aberto.grupo && (
                    <form action="/aluno/calendario/acao" method="post">
                      <input type="hidden" name="acao" value="apagar_serie" /><input type="hidden" name="id" value={aberto.id} /><input type="hidden" name="mes" value={mes} />
                      <button className="btn-link" type="submit">Apagar este e os próximos da série</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* janela de criar / editar (treinador) */}
        {(novoDia || editando) && (
          <div className="modal-fundo">
            <Link className="modal-fora" href={fechar} aria-label="Fechar" />
            <div className="modal" role="dialog" aria-modal="true" aria-label={editando ? "Editar evento" : "Novo evento"}>
              <Link className="modal-x" href={fechar} aria-label="Fechar">×</Link>
              <h2>{editando ? "Editar evento" : "Novo evento"}</h2>
              {formEvento(editando, novoDia ?? hoje)}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
