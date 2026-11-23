import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { dataBR, hojeSP, pace } from "@/lib/semana";
import { CATEGORIAS_PROVA, DISTANCIAS, diasAte, kmDaProva, nomeDistancia, tempoBR, type Prova } from "@/lib/provas";

export const metadata = { title: "Provas · Korrá Running Club" };

type Inscricao = { id: string; categoria: "alvo" | "secundaria"; status: string; tempo_oficial_s: number | null; provas: Prova };

const OK: Record<string, string> = {
  inscrito: "Prova adicionada! Bons treinos.",
  categoria: "Categoria atualizada.",
  tempo: "Tempo registrado. Parabéns pela prova!",
  nao_correu: "Anotado. Bora para a próxima.",
  removida: "Prova removida da sua lista.",
};
const ERRO: Record<string, string> = {
  nome: "Coloque o nome da prova.",
  data: "Confira a data (precisa ser hoje ou depois).",
  distancia: "Escolha a distância.",
  escolha: "Escolha uma prova da lista.",
  ja_inscrito: "Essa prova já está na sua lista.",
  tempo: "Confira o tempo (ex.: 52:30 ou 1:45:10).",
  tabela: "A área de provas ainda está sendo ligada. Fale com o treinador.",
  salvar: "Não conseguimos salvar agora. Tente de novo.",
};

function Contagem({ dias }: { dias: number }) {
  if (dias === 0) return <span className="contagem hoje">É hoje!</span>;
  if (dias === 1) return <span className="contagem"><b>1</b> dia</span>;
  return <span className="contagem"><b>{dias}</b> dias</span>;
}

export default async function ProvasPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/provas");
  const { supabase, user, perfil } = sessao;
  const treinador = perfil?.papel === "treinador";
  const liberado = perfil?.status === "ativo" || treinador;
  const { ok, erro } = await searchParams;
  const hoje = hojeSP();

  let minhas: Inscricao[] = [];
  let lista: Prova[] = [];
  const participantes = new Map<string, { nome: string; categoria: string }[]>();
  if (liberado) {
    const [{ data: insc }, { data: provas }, { data: parts }] = await Promise.all([
      supabase.from("prova_inscricoes").select("id, categoria, status, tempo_oficial_s, provas(id, nome, data, distancia, distancia_km, cidade, link)")
        .eq("user_id", user.id),
      supabase.from("provas").select("id, nome, data, distancia, distancia_km, cidade, link").gte("data", hoje).order("data"),
      supabase.rpc("provas_participantes"),
    ]);
    minhas = ((insc ?? []) as unknown as Inscricao[]).filter((i) => i.provas).sort((a, b) => a.provas.data.localeCompare(b.provas.data));
    lista = (provas ?? []) as Prova[];
    for (const p of (parts ?? []) as { prova_id: string; nome: string; categoria: string }[]) {
      const l = participantes.get(p.prova_id) ?? [];
      l.push({ nome: p.nome, categoria: p.categoria });
      participantes.set(p.prova_id, l);
    }
  }
  const primeiro = (n: string) => n.trim().split(/\s+/)[0];
  const futuras = minhas.filter((i) => i.provas.data >= hoje && i.status === "inscrito");
  const alvos = futuras.filter((i) => i.categoria === "alvo");
  const secundarias = futuras.filter((i) => i.categoria === "secundaria");
  const aLancar = minhas.filter((i) => i.provas.data < hoje && i.status === "inscrito");
  const historico = minhas.filter((i) => i.status !== "inscrito").reverse();
  const jaTenho = new Set(minhas.map((i) => i.provas.id));
  const disponiveis = lista.filter((p) => !jaTenho.has(p.id));

  const outros = (p: Prova) => (participantes.get(p.id) ?? []).filter((x) => x.nome !== perfil?.nome);
  const quemVai = (p: Prova) => {
    const o = outros(p);
    if (!o.length) return null;
    const nomes = o.slice(0, 3).map((x) => primeiro(x.nome)).join(", ");
    return `${nomes}${o.length > 3 ? ` e mais ${o.length - 3}` : ""} também ${o.length === 1 ? "vai" : "vão"}`;
  };
  const acoes = (i: Inscricao) => (
    <div className="prova-acoes">
      <form action="/aluno/provas/acao" method="post">
        <input type="hidden" name="acao" value="categoria" /><input type="hidden" name="id" value={i.id} />
        <input type="hidden" name="categoria" value={i.categoria === "alvo" ? "secundaria" : "alvo"} />
        <button className="btn-link" type="submit">{i.categoria === "alvo" ? "Mudar para secundária" : "Tornar prova-alvo"}</button>
      </form>
      <form action="/aluno/provas/acao" method="post">
        <input type="hidden" name="acao" value="remover" /><input type="hidden" name="id" value={i.id} />
        <button className="btn-link" type="submit">Remover</button>
      </form>
    </div>
  );
  const info = (p: Prova) => (
    <span className="prova-info">
      {dataBR(p.data)} · {nomeDistancia(p)}{p.cidade ? ` · ${p.cidade}` : ""}
      {p.link && <> · <a href={p.link} target="_blank" rel="noopener noreferrer">site da prova ↗</a></>}
    </span>
  );

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={treinador} />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Calendário Korrá</div>
          <h1 style={{ marginTop: 14 }}>Provas</h1>
          <p style={{ marginTop: 12, maxWidth: 640 }}>
            Coloque aqui as provas em que você está inscrito. A <b>prova-alvo</b> é aquela em que buscamos a sua melhor performance; as{" "}
            <b>secundárias</b> fazem parte do processo de treino.
          </p>
          {ok && <p className="msg" style={{ marginTop: 16 }}>{OK[ok] ?? "Pronto."}</p>}
          {erro && <p className="msg erro" style={{ marginTop: 16 }}>{ERRO[erro] ?? "Algo deu errado."}</p>}

          {!liberado ? (
            <p className="msg" style={{ marginTop: 24 }}>A área de provas libera assim que sua matrícula estiver ativa.</p>
          ) : (
            <>
              {aLancar.length > 0 && (
                <section id="lancar" style={{ marginTop: 32 }}>
                  <h2 className="sub-provas">Como foi?</h2>
                  <div className="provas-grid">
                    {aLancar.map((i) => (
                      <div key={i.id} className="prova-card lancar">
                        <span className="prova-cat">{CATEGORIAS_PROVA[i.categoria]}</span>
                        <h3>{i.provas.nome}</h3>
                        {info(i.provas)}
                        <form action="/aluno/provas/acao" method="post" className="form-tempo">
                          <input type="hidden" name="acao" value="tempo" /><input type="hidden" name="id" value={i.id} />
                          <input type="hidden" name="ancora" value="lancar" />
                          <label htmlFor={`t-${i.id}`}>Tempo oficial</label>
                          <input id={`t-${i.id}`} name="tempo" placeholder="ex.: 52:30 ou 1:45:10" inputMode="numeric" required />
                          <button className="btn btn-primary" type="submit">Salvar</button>
                        </form>
                        <form action="/aluno/provas/acao" method="post">
                          <input type="hidden" name="acao" value="nao_correu" /><input type="hidden" name="id" value={i.id} />
                          <button className="btn-link" type="submit">Não corri essa</button>
                        </form>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section id="minhas" style={{ marginTop: 40 }}>
                <h2 className="sub-provas">Prova-alvo</h2>
                {alvos.length === 0 ? (
                  <p className="regra" style={{ marginTop: 8 }}>Nenhuma prova-alvo ainda. Adicione abaixo a prova em que você quer render o máximo.</p>
                ) : (
                  <div className="provas-grid">
                    {alvos.map((i) => (
                      <div key={i.id} className="prova-card alvo">
                        <div className="prova-topo">
                          <span className="prova-cat">Prova-alvo</span>
                          <Contagem dias={diasAte(i.provas.data, hoje)} />
                        </div>
                        <h3>{i.provas.nome}</h3>
                        {info(i.provas)}
                        {quemVai(i.provas) && <p className="quem-vai">{quemVai(i.provas)}</p>}
                        <p className="ciclo-aviso">Seu ciclo de treino para esta prova aparece aqui assim que o treinador configurar.</p>
                        {acoes(i)}
                      </div>
                    ))}
                  </div>
                )}

                <h2 className="sub-provas" style={{ marginTop: 32 }}>Provas secundárias</h2>
                {secundarias.length === 0 ? (
                  <p className="regra" style={{ marginTop: 8 }}>Nenhuma prova secundária.</p>
                ) : (
                  <ul className="provas-lista">
                    {secundarias.map((i) => (
                      <li key={i.id}>
                        <div style={{ minWidth: 0 }}>
                          <b>{i.provas.nome}</b>
                          {info(i.provas)}
                          {quemVai(i.provas) && <span className="quem-vai">{quemVai(i.provas)}</span>}
                          {acoes(i)}
                        </div>
                        <Contagem dias={diasAte(i.provas.data, hoje)} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section id="adicionar" style={{ marginTop: 48 }}>
                <h2 className="sub-provas">Adicionar prova</h2>
                <div className="provas-add">
                  <form className="panel" action="/aluno/provas/acao" method="post">
                    <input type="hidden" name="acao" value="inscrever" /><input type="hidden" name="ancora" value="minhas" />
                    <p className="regra">Escolha da lista de provas que a turma da Korrá já cadastrou:</p>
                    <div className="field"><label htmlFor="a-prova">Prova</label>
                      <select id="a-prova" name="prova_id" required defaultValue="">
                        <option value="" disabled>{disponiveis.length ? "Escolha a prova" : "Nenhuma prova na lista ainda"}</option>
                        {disponiveis.map((p) => {
                          const n = (participantes.get(p.id) ?? []).length;
                          return <option key={p.id} value={p.id}>{dataBR(p.data)} · {p.nome} · {nomeDistancia(p)}{n ? ` · ${n} da Korrá` : ""}</option>;
                        })}
                      </select>
                    </div>
                    <fieldset className="field cat-escolha"><legend>Para você, ela é:</legend>
                      <label><input type="radio" name="categoria" value="alvo" /> Prova-alvo</label>
                      <label><input type="radio" name="categoria" value="secundaria" defaultChecked /> Secundária</label>
                    </fieldset>
                    <button className="btn btn-primary" type="submit" disabled={!disponiveis.length}>Adicionar</button>
                  </form>

                  <details className="panel nova-prova" open={!disponiveis.length}>
                    <summary>Não achou? Cadastre a prova</summary>
                    <form action="/aluno/provas/acao" method="post" style={{ display: "grid", gap: 14, marginTop: 14 }}>
                      <input type="hidden" name="acao" value="nova" /><input type="hidden" name="ancora" value="minhas" />
                      <div className="field"><label htmlFor="n-nome">Nome da prova</label><input id="n-nome" name="nome" required maxLength={120} placeholder="Ex.: Maratona Internacional de Floripa" /></div>
                      <div className="field"><label htmlFor="n-data">Data</label><input id="n-data" name="data" type="date" min={hoje} required /></div>
                      <div className="field"><label htmlFor="n-dist">Distância</label>
                        <select id="n-dist" name="distancia" required defaultValue="">
                          <option value="" disabled>Escolha</option>
                          {Object.entries(DISTANCIAS).map(([k, d]) => <option key={k} value={k}>{d.nome}</option>)}
                        </select>
                      </div>
                      <div className="field"><label htmlFor="n-km">Quantos km? (só para trail ou outra distância)</label><input id="n-km" name="distancia_km" inputMode="decimal" placeholder="Ex.: 25" /></div>
                      <div className="field"><label htmlFor="n-cid">Cidade</label><input id="n-cid" name="cidade" maxLength={80} placeholder="Ex.: Florianópolis" /></div>
                      <div className="field"><label htmlFor="n-link">Site da prova (opcional)</label><input id="n-link" name="link" maxLength={300} placeholder="Ex.: www.provadeexemplo.com.br" /></div>
                      <fieldset className="field cat-escolha"><legend>Para você, ela é:</legend>
                        <label><input type="radio" name="categoria" value="alvo" /> Prova-alvo</label>
                        <label><input type="radio" name="categoria" value="secundaria" defaultChecked /> Secundária</label>
                      </fieldset>
                      <button className="btn btn-primary" type="submit">Cadastrar e adicionar</button>
                    </form>
                  </details>
                </div>
              </section>

              {lista.length > 0 && (
                <section id="calendario" style={{ marginTop: 48 }}>
                  <h2 className="sub-provas">Próximas provas da turma</h2>
                  <ul className="provas-lista">
                    {lista.slice(0, 20).map((p) => {
                      const todos = participantes.get(p.id) ?? [];
                      return (
                        <li key={p.id}>
                          <div style={{ minWidth: 0 }}>
                            <b>{p.nome}</b>
                            {info(p)}
                            {todos.length > 0 && <span className="quem-vai">{todos.map((x) => primeiro(x.nome)).join(", ")}</span>}
                          </div>
                          <Contagem dias={diasAte(p.data, hoje)} />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {historico.length > 0 && (
                <section id="historico" style={{ marginTop: 48 }}>
                  <h2 className="sub-provas">Minhas provas realizadas</h2>
                  <div style={{ overflowX: "auto", marginTop: 12 }}>
                    <table className="tabela">
                      <thead><tr><th>Data</th><th>Prova</th><th>Distância</th><th>Tempo</th><th>Pace</th></tr></thead>
                      <tbody>
                        {historico.map((i) => {
                          const km = kmDaProva(i.provas);
                          return (
                            <tr key={i.id}>
                              <td>{dataBR(i.provas.data)}</td>
                              <td>{i.provas.nome}{i.categoria === "alvo" ? " · alvo" : ""}</td>
                              <td>{nomeDistancia(i.provas)}</td>
                              <td>{i.status === "nao_correu" ? "Não correu" : i.tempo_oficial_s ? tempoBR(i.tempo_oficial_s) : "—"}</td>
                              <td>{i.tempo_oficial_s && km ? pace(i.tempo_oficial_s / km) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
