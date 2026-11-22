import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CATALOGO, CORES, ESTAMPAS, TAMANHOS, TIPOS_MOV, reais, type TipoMov } from "@/lib/loja";

export const metadata = { title: "Loja e estoque · Korrá Running Club" };

type Item = { id: string; produto: string; nome: string; quantidade: number; ordem: number };
type Mov = { id: string; data: string; tipo: TipoMov; descricao: string | null; valor: number };

const OK: Record<string, string> = {
  semeado: "Lista padrão criada. Agora é só contar e preencher as quantidades.",
  item: "Item adicionado ao estoque.",
  contagem: "Contagem salva.",
  movimento: "Lançamento salvo no caixa da loja.",
  apagado: "Removido.",
};
const ERRO: Record<string, string> = {
  item: "Confira os dados do item.",
  duplicado: "Esse item já existe no estoque.",
  tipo: "Escolha o tipo do lançamento.",
  valor: "Confira o valor (ex.: 139,99).",
  salvar: "Não conseguimos salvar. Tente de novo.",
};

export default async function LojaAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/loja");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;
  const { ok, erro } = await searchParams;

  const [{ data: itensRaw }, { data: movRaw }] = await Promise.all([
    supabase.from("estoque_itens").select("id, produto, nome, quantidade, ordem").order("ordem").order("nome"),
    supabase.from("loja_movimentos").select("id, data, tipo, descricao, valor").order("data", { ascending: false }).order("criado_em", { ascending: false }),
  ]);
  const itens = (itensRaw ?? []) as Item[];
  const movs = (movRaw ?? []) as Mov[];

  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const caixa = movs.reduce((s, m) => s + Number(m.valor), 0);
  const vendasMes = movs.filter((m) => m.tipo === "venda" && m.data >= `${hoje.slice(0, 8)}01`).reduce((s, m) => s + Number(m.valor), 0);
  const totCamisetas = itens.filter((i) => i.produto === "camiseta").reduce((s, i) => s + i.quantidade, 0);
  const totSqueeze = itens.filter((i) => i.produto === "squeeze").reduce((s, i) => s + i.quantidade, 0);

  const porNome = new Map(itens.map((i) => [i.nome, i]));
  const naMatriz = new Set<string>();
  const linhas = CORES.flatMap((cor) => ESTAMPAS.map((est) => ({ cor, est })));
  const outros = () => itens.filter((i) => !naMatriz.has(i.id));
  const dataBR = (d: string) => d.split("-").reverse().join("/");

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Painel do treinador</div>
          <h1 style={{ marginTop: 14 }}>Loja e estoque</h1>
          {ok && <p className="msg" style={{ marginTop: 16 }}>{OK[ok] ?? "Pronto."}</p>}
          {erro && <p className="msg erro" style={{ marginTop: 16 }}>{ERRO[erro] ?? "Algo deu errado."}</p>}

          <div className="grid-cards">
            <div className="tile"><span className="k">Caixa da loja</span><span className="v">{reais(caixa)}</span><span>saldo de todos os lançamentos</span></div>
            <div className="tile"><span className="k">Vendas no mês</span><span className="v">{reais(vendasMes)}</span><span>lançadas como “Venda”</span></div>
            <div className="tile"><span className="k">Camisetas em estoque</span><span className="v">{totCamisetas}</span><span>peças</span></div>
            <div className="tile"><span className="k">Squeezes em estoque</span><span className="v">{totSqueeze}</span><span>peças</span></div>
          </div>

          {/* ESTOQUE */}
          <h2 id="estoque" style={{ marginTop: 56, fontSize: "clamp(26px,3.4vw,36px)" }}>Estoque</h2>
          {itens.length === 0 ? (
            <div className="strava-box" style={{ marginTop: 16 }}>
              <p>Comece criando a lista padrão: camisetas preta e branca, estampa no peito e nas costas, do PP ao XGG, mais o squeeze. Depois é só contar.</p>
              <form action="/treinador/loja/acao" method="post">
                <input type="hidden" name="acao" value="semear" />
                <button className="btn btn-primary" type="submit">Criar lista padrão</button>
              </form>
            </div>
          ) : (
            <form action="/treinador/loja/acao" method="post" style={{ marginTop: 16 }}>
              <input type="hidden" name="acao" value="contagem" />
              <p className="regra">Faça a contagem e digite a quantidade de cada peça. Depois clique em “Salvar contagem”.</p>
              <div style={{ overflowX: "auto", marginTop: 12 }}>
                <table className="tabela matriz">
                  <thead>
                    <tr><th>Camiseta</th>{TAMANHOS.map((t) => <th key={t}>{t}</th>)}<th>Total</th></tr>
                  </thead>
                  <tbody>
                    {linhas.map(({ cor, est }) => {
                      let total = 0;
                      return (
                        <tr key={`${cor}-${est}`}>
                          <td><span className={`bola-cor ${cor === "Preta" ? "preta" : "branca"}`} /> {cor} · {est}</td>
                          {TAMANHOS.map((t) => {
                            const it = porNome.get(`Camiseta ${cor} · ${est} · ${t}`);
                            if (!it) return <td key={t}>—</td>;
                            naMatriz.add(it.id);
                            total += it.quantidade;
                            return (
                              <td key={t}>
                                <input className={`qtd${it.quantidade === 0 ? " zero" : ""}`} name={`q_${it.id}`} type="number" min={0} inputMode="numeric"
                                  defaultValue={it.quantidade} aria-label={`${cor} ${est} ${t}`} />
                              </td>
                            );
                          })}
                          <td><b>{total}</b></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {outros().length > 0 && (
                <div className="outros-itens">
                  {outros().map((it) => (
                    <label key={it.id} className="outro-item">
                      <span>{it.nome}</span>
                      <input className={`qtd${it.quantidade === 0 ? " zero" : ""}`} name={`q_${it.id}`} type="number" min={0} inputMode="numeric" defaultValue={it.quantidade} />
                    </label>
                  ))}
                </div>
              )}
              <button className="btn btn-primary" type="submit" style={{ marginTop: 16 }}>Salvar contagem</button>
            </form>
          )}

          {itens.length > 0 && (
            <details className="gerenciar" style={{ marginTop: 20 }}>
              <summary>Adicionar ou remover itens do estoque</summary>
              <form action="/treinador/loja/acao" method="post" className="panel" style={{ marginTop: 12 }}>
                <input type="hidden" name="acao" value="item" />
                <div className="field"><label htmlFor="e-prod">Produto</label>
                  <select id="e-prod" name="produto" defaultValue="camiseta">
                    <option value="camiseta">Camiseta</option><option value="squeeze">Squeeze</option><option value="outro">Outro</option>
                  </select>
                </div>
                <div className="linha-campos">
                  <div className="field"><label htmlFor="e-cor">Cor</label><select id="e-cor" name="cor">{CORES.map((c) => <option key={c}>{c}</option>)}</select></div>
                  <div className="field"><label htmlFor="e-est">Estampa</label><select id="e-est" name="estampa">{ESTAMPAS.map((c) => <option key={c}>{c}</option>)}</select></div>
                  <div className="field"><label htmlFor="e-tam">Tamanho</label><select id="e-tam" name="tamanho">{TAMANHOS.map((c) => <option key={c}>{c}</option>)}</select></div>
                </div>
                <div className="field"><label htmlFor="e-nome">Nome (para squeeze ou outro produto)</label><input id="e-nome" name="nome" placeholder="Ex.: Boné Korrá" /></div>
                <div className="field"><label htmlFor="e-qtd">Quantidade</label><input id="e-qtd" name="quantidade" type="number" min={0} defaultValue={0} /></div>
                <button className="btn btn-primary" type="submit">Adicionar item</button>
              </form>
              <ul className="lista-remover">
                {itens.map((it) => (
                  <li key={it.id}>
                    <span>{it.nome}</span>
                    <form action="/treinador/loja/acao" method="post">
                      <input type="hidden" name="acao" value="apagar_item" />
                      <input type="hidden" name="id" value={it.id} />
                      <button className="btn-link" type="submit">remover</button>
                    </form>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* CAIXA */}
          <h2 id="caixa" style={{ marginTop: 64, fontSize: "clamp(26px,3.4vw,36px)" }}>Caixa da loja</h2>
          <div className="despesas-grid">
            <form className="panel" action="/treinador/loja/acao" method="post">
              <input type="hidden" name="acao" value="movimento" />
              <input type="hidden" name="ancora" value="caixa" />
              <div className="field"><label htmlFor="m-tipo">Tipo</label>
                <select id="m-tipo" name="tipo" defaultValue="venda">
                  {Object.entries(TIPOS_MOV).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="m-data">Data</label><input id="m-data" name="data" type="date" defaultValue={hoje} max={hoje} /></div>
              <div className="field"><label htmlFor="m-desc">Descrição</label><input id="m-desc" name="descricao" maxLength={200} placeholder="Ex.: Kit 2 camisetas – João" /></div>
              <div className="field"><label htmlFor="m-valor">Valor (R$)</label><input id="m-valor" name="valor" inputMode="decimal" required placeholder="139,99" /></div>
              <p className="regra">
                Venda e saldo inicial entram somando; compra de estoque e retirada entram descontando. Em “Ajuste”, use – para descontar.
              </p>
              <p className="regra">Preços: {CATALOGO.map((c) => `${c.nome} ${reais(c.preco)}`).join(" · ")}</p>
              <button className="btn btn-primary" type="submit">Lançar no caixa →</button>
            </form>
            <div style={{ minWidth: 0, overflowX: "auto" }}>
              <table className="tabela">
                <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th style={{ textAlign: "right" }}>Valor</th><th></th></tr></thead>
                <tbody>
                  {movs.length === 0 && <tr><td colSpan={5}>Nenhum lançamento ainda. Comece pelo <b>Saldo inicial</b> com o valor que já está em caixa das vendas até hoje.</td></tr>}
                  {movs.map((m) => (
                    <tr key={m.id}>
                      <td>{dataBR(m.data)}</td>
                      <td>{TIPOS_MOV[m.tipo]?.nome ?? m.tipo}</td>
                      <td>{m.descricao ?? "—"}</td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: Number(m.valor) < 0 ? "#8d2a17" : undefined }}>{reais(Number(m.valor))}</td>
                      <td>
                        <form action="/treinador/loja/acao" method="post">
                          <input type="hidden" name="acao" value="apagar_mov" />
                          <input type="hidden" name="ancora" value="caixa" />
                          <input type="hidden" name="id" value={m.id} />
                          <button className="btn-link" type="submit">Apagar</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
