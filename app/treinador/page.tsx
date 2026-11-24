import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { formatarTelefone, idade } from "@/lib/cadastro";
import { CATEGORIAS, brl, type Categoria } from "@/lib/despesas";

export const metadata = { title: "Painel do treinador · Korrá Running Club" };

const MENSALIDADE = 165;

const ERROS: Record<string, string> = {
  salvar: "Não conseguimos atualizar o aluno. Tente de novo; se continuar, avise o suporte.",
  permissao: "Só o treinador pode mudar o status dos alunos.",
  dados: "Ação inválida.",
  despesa: "Não conseguimos salvar a despesa. Tente de novo.",
  despesa_data: "Confira a data da despesa.",
  despesa_categoria: "Escolha a categoria da despesa.",
  despesa_valor: "Confira o valor (ex.: 45,90).",
  strava_webhook: "O Strava recusou a ligação automática. Confira as variáveis no Cloudflare e tente de novo.",
};
const OKS: Record<string, string> = {
  "1": "Aluno atualizado.",
  despesa: "Despesa lançada.",
  despesa_apagada: "Despesa apagada.",
  strava_webhook: "Pronto! Agora o Strava avisa o app sempre que um aluno conectado salvar uma corrida.",
  strava_ja: "A atualização automática do Strava já estava ligada.",
};

export default async function TreinadorPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string; feitos?: string; restam?: string }>;
}) {
  const { erro, ok, feitos, restam } = await searchParams;
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;

  const { data: alunos } = await supabase
    .from("perfis")
    .select("id, nome, email, telefone, status, criado_em, valor_mensal, data_nascimento, objetivo, responsavel_nome, responsavel_telefone, autoriza_imagem, cadastro_completo")
    .eq("papel", "aluno")
    .order("nome");

  // Datas no fuso de Florianópolis
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const desde = `${hoje.slice(0, 8)}01`;
  const nomeMes = new Date(`${desde}T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const { data: despesas } = await supabase
    .from("despesas")
    .select("id, data, categoria, descricao, valor")
    .gte("data", desde)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });
  const porCategoria = new Map<string, number>();
  for (const d of despesas ?? []) porCategoria.set(d.categoria, (porCategoria.get(d.categoria) ?? 0) + Number(d.valor));
  const fmtData = (d: string) => d.split("-").reverse().join("/");

  const lista = alunos ?? [];
  const ativos = lista.filter((a) => a.status === "ativo").length;
  const totalDespesas = (despesas ?? []).reduce((s, d) => s + Number(d.valor), 0);
  const valorDe = (a: { valor_mensal: number | string | null }) => (a.valor_mensal === null ? MENSALIDADE : Number(a.valor_mensal));
  const listaAtivos = lista.filter((a) => a.status === "ativo");
  const receitaPrevista = listaAtivos.reduce((s, a) => s + valorDe(a), 0);
  const gratuitos = listaAtivos.filter((a) => valorDe(a) === 0).length;

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Painel do treinador</div>
          <h1 style={{ marginTop: "14px" }}>Visão do mês</h1>
          <p style={{ marginTop: "12px", display: "flex", gap: "22px", flexWrap: "wrap" }}><a className="link-mapa" href="/treinador/ciclos">Ciclos das provas-alvo →</a><a className="link-mapa" href="/treinador/loja">Loja e estoque →</a><a className="link-mapa" href="/treinador/conteudos">Publicar vídeos no fórum →</a></p>
          {erro && <p className="msg erro" style={{ marginTop: "18px" }}>{ERROS[erro] ?? "Algo deu errado."}</p>}
          {ok && <p className="msg" style={{ marginTop: "18px" }}>{OKS[ok] ?? "Pronto."}</p>}

          <div className="grid-cards">
            <div className="tile"><span className="k">Alunos ativos</span><span className="v">{ativos}</span><span>de {lista.length} cadastrados</span></div>
            <div className="tile"><span className="k">Receita prevista</span><span className="v">{brl(receitaPrevista)}</span><span>{ativos - gratuitos} pagantes{gratuitos ? ` · ${gratuitos} gratuito${gratuitos > 1 ? "s" : ""}` : ""}</span></div>
            <div className="tile"><span className="k">Despesas no mês</span><span className="v">{brl(totalDespesas)}</span><span>{(despesas ?? []).length} lançamentos em {nomeMes}</span></div>
            <div className="tile"><span className="k">Saldo previsto</span><span className="v">{brl(receitaPrevista - totalDespesas)}</span><span>receita − despesas</span></div>
          </div>

          <h2 id="alunos" style={{ marginTop: "56px", fontSize: "clamp(26px,3.4vw,36px)" }}>Alunos</h2>
          {ok === "valor" && <p className="msg" style={{ marginTop: "14px" }}>Mensalidade atualizada.</p>}
          {erro === "valor_aluno" && <p className="msg erro" style={{ marginTop: "14px" }}>Confira o valor (ex.: 165 ou 120,00).</p>}
          <div style={{ overflowX: "auto", marginTop: "18px" }}>
            <table className="tabela">
              <thead>
                <tr><th>Nome</th><th>Contato</th><th>Idade · objetivo</th><th>Mensalidade</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {lista.length === 0 && (
                  <tr><td colSpan={6}>Nenhum aluno cadastrado ainda. Quando alguém entrar pela área do aluno, aparece aqui.</td></tr>
                )}
                {lista.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.nome ?? "—"}
                      {!a.cadastro_completo && <div className="sub">cadastro incompleto</div>}
                    </td>
                    <td>
                      {a.email}
                      {a.telefone && <div className="sub">{formatarTelefone(a.telefone)}</div>}
                    </td>
                    <td>
                      {idade(a.data_nascimento) ?? "—"}{idade(a.data_nascimento) !== null ? " anos" : ""}
                      {idade(a.data_nascimento) !== null && (idade(a.data_nascimento) as number) < 18 && (
                        <div className="sub">menor · resp.: {a.responsavel_nome} {formatarTelefone(a.responsavel_telefone)}</div>
                      )}
                      {a.objetivo && <div className="sub">{a.objetivo}</div>}
                      {a.cadastro_completo && !a.autoriza_imagem && <div className="sub">não autoriza imagem</div>}
                    </td>
                    <td>
                      <form action="/treinador/valor" method="post" className="form-valor">
                        <input type="hidden" name="id" value={a.id} />
                        <span className="prefixo">R$</span>
                        <input name="valor" inputMode="decimal" aria-label={`Mensalidade de ${a.nome ?? "aluno"}`}
                          defaultValue={a.valor_mensal === null ? "" : Number(a.valor_mensal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          placeholder={String(MENSALIDADE)} />
                        <button className="btn-link" type="submit">Salvar</button>
                      </form>
                      <div className="sub" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {valorDe(a) === 0 ? <span className="pill">Gratuito</span> : a.valor_mensal === null ? <span>padrão</span> : <span>personalizado</span>}
                        {valorDe(a) !== 0 && (
                          <form action="/treinador/valor" method="post">
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="modo" value="gratuito" />
                            <button className="btn-link" type="submit">tornar gratuito</button>
                          </form>
                        )}
                        {a.valor_mensal !== null && (
                          <form action="/treinador/valor" method="post">
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="modo" value="padrao" />
                            <button className="btn-link" type="submit">voltar ao padrão</button>
                          </form>
                        )}
                      </div>
                    </td>
                    <td><span className={`pill ${a.status}`}>{a.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {a.status !== "ativo" && (
                          <form action="/treinador/status" method="post">
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="status" value="ativo" />
                            <button className="btn-link" type="submit">Ativar</button>
                          </form>
                        )}
                        {a.status !== "bloqueado" && (
                          <form action="/treinador/status" method="post">
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="status" value="bloqueado" />
                            <button className="btn-link" type="submit">Bloquear</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 id="despesas" style={{ marginTop: "64px", fontSize: "clamp(26px,3.4vw,36px)" }}>Despesas de {nomeMes}</h2>
          {ok?.startsWith("despesa") && <p className="msg" style={{ marginTop: "14px" }}>{OKS[ok]}</p>}
          {erro?.startsWith("despesa") && <p className="msg erro" style={{ marginTop: "14px" }}>{ERROS[erro]}</p>}
          <div className="despesas-grid">
            <form className="panel" action="/treinador/despesas" method="post">
              <input type="hidden" name="acao" value="lancar" />
              <div className="field">
                <label htmlFor="d-data">Data</label>
                <input id="d-data" name="data" type="date" required defaultValue={hoje} max={hoje} />
              </div>
              <div className="field">
                <label htmlFor="d-categoria">Categoria</label>
                <select id="d-categoria" name="categoria" required defaultValue="">
                  <option value="" disabled>Escolha</option>
                  {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="d-descricao">Descrição (opcional)</label>
                <input id="d-descricao" name="descricao" maxLength={200} placeholder="Ex.: galão de água para o treino de terça" />
              </div>
              <div className="field">
                <label htmlFor="d-valor">Valor (R$)</label>
                <input id="d-valor" name="valor" inputMode="decimal" required placeholder="45,90" />
              </div>
              <button className="btn btn-primary" type="submit">Lançar despesa →</button>
            </form>

            <div style={{ minWidth: 0 }}>
              {porCategoria.size > 0 && (
                <div className="cat-resumo">
                  {[...porCategoria.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => (
                    <span key={c} className="cat-chip">{CATEGORIAS[c as Categoria] ?? c}: <b>{brl(v)}</b></span>
                  ))}
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table className="tabela">
                  <thead>
                    <tr><th>Data</th><th>Categoria</th><th>Descrição</th><th style={{ textAlign: "right" }}>Valor</th><th></th></tr>
                  </thead>
                  <tbody>
                    {(despesas ?? []).length === 0 && (
                      <tr><td colSpan={5}>Nenhuma despesa lançada neste mês. Use o formulário ao lado para lançar a primeira.</td></tr>
                    )}
                    {(despesas ?? []).map((d) => (
                      <tr key={d.id}>
                        <td>{fmtData(d.data)}</td>
                        <td>{CATEGORIAS[d.categoria as Categoria] ?? d.categoria}</td>
                        <td>{d.descricao ?? "—"}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{brl(Number(d.valor))}</td>
                        <td>
                          <form action="/treinador/despesas" method="post">
                            <input type="hidden" name="acao" value="apagar" />
                            <input type="hidden" name="id" value={d.id} />
                            <button className="btn-link" type="submit" aria-label="Apagar despesa">Apagar</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <h2 id="strava" style={{ marginTop: "64px", fontSize: "clamp(26px,3.4vw,36px)" }}>Strava</h2>
          {ok?.startsWith("strava") && (
            <p className="msg" style={{ marginTop: "14px" }}>
              {ok === "strava_semestral"
                ? `Ranking semestral recalculado para ${feitos ?? 0} aluno(s).${Number(restam) > 0 ? ` Faltam ${restam}: clique de novo.` : " Todos em dia!"}`
                : OKS[ok]}
            </p>
          )}
          {erro?.startsWith("strava") && <p className="msg erro" style={{ marginTop: "14px" }}>{ERROS[erro]}</p>}
          <div className="strava-box">
            <p>Para os treinos entrarem sozinhos no <a href="/aluno/ranking">ranking</a>, ligue a atualização automática uma única vez (depois de configurar as chaves do Strava no Cloudflare).</p>
            <form action="/treinador/strava" method="post"><button className="btn btn-strava" type="submit">Ligar atualização automática</button></form>
          </div>
          <div className="strava-box">
            <p><b>Ranking semestral.</b> Atualiza sozinho a cada corrida nova. Se quiser forçar agora (por exemplo, na primeira vez), clique abaixo — ele faz alguns alunos por vez.</p>
            <form action="/treinador/semestral" method="post"><button className="btn btn-ghost" type="submit">Recalcular semestre</button></form>
          </div>
        </div>
      </main>
    </>
  );
}
