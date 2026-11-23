import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CATALOGO, CORES, ESTILOS, NOME_ESTILO, TAMANHOS, TIPOS_MOV, nomeCamiseta, reais, type TipoMov } from "@/lib/loja";

export const metadata = { title: "Loja e estoque · Korrá Running Club" };

type Item = { id: string; produto: string; nome: string; quantidade: number; ordem: number };
type Pedido = {
  id: string; codigo: string; criado_em: string; nome: string; telefone: string | null; item_nome: string;
  quantidade: number; valor: number; observacao: string | null; status: string; finalizado_em: string | null; pago_em: string | null;
  pedido_itens: { estoque_item_id: string | null; descricao: string }[];
};
type Mov = { id: string; data: string; tipo: TipoMov; descricao: string | null; valor: number };

const OK: Record<string, string> = {
  semeado: "Lista padrão criada. Agora é só contar e preencher as quantidades.",
  item: "Item adicionado ao estoque.",
  contagem: "Contagem salva.",
  movimento: "Lançamento salvo no caixa da loja.",
  apagado: "Removido.",
  pago: "Pix confirmado: a venda entrou no caixa. Agora é só entregar.",
  entregue: "Pedido entregue: as peças saíram do estoque.",
  cancelado: "Pedido cancelado. As peças voltaram a ficar disponíveis.",
};
const ERRO: Record<string, string> = {
  item: "Confira os dados do item.",
  duplicado: "Esse item já existe no estoque.",
  tipo: "Escolha o tipo do lançamento.",
  valor: "Confira o valor (ex.: 139,99).",
  salvar: "Não conseguimos salvar. Tente de novo.",
  pedido: "Esse pedido já mudou de situação. Recarregue a página.",
  tabela: "O banco ainda não tem as tabelas da loja. Rode o SQL 0011 no Supabase (SQL Editor) e tente de novo.",
};

export default async function LojaAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/loja");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;
  const { ok, erro } = await searchParams;

  const [{ data: itensRaw }, { data: movRaw }, { data: pedRaw }] = await Promise.all([
    supabase.from("estoque_itens").select("id, produto, nome, quantidade, ordem").order("ordem").order("nome"),
    supabase.from("loja_movimentos").select("id, data, tipo, descricao, valor").order("data", { ascending: false }).order("criado_em", { ascending: false }),
    supabase.from("pedidos").select("id, codigo, criado_em, nome, telefone, item_nome, quantidade, valor, observacao, status, finalizado_em, pago_em, pedido_itens(estoque_item_id, descricao)")
      .order("criado_em", { ascending: false }).limit(60),
  ]);
  const pedidos = (pedRaw ?? []) as Pedido[];
  const aguardando = pedidos.filter((p) => p.status === "pendente");
  const pagos = pedidos.filter((p) => p.status === "pago");
  const pendentes = [...aguardando, ...pagos]; // peças reservadas
  const finalizados = pedidos.filter((p) => p.status === "entregue" || p.status === "cancelado").slice(0, 15);
  const reservado = new Map<string, number>();
  for (const p of pendentes) for (const it of p.pedido_itens) if (it.estoque_item_id) reservado.set(it.estoque_item_id, (reservado.get(it.estoque_item_id) ?? 0) + 1);
  const totReservado = [...reservado.values()].reduce((a, b) => a + b, 0);
  const quandoBR = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const zap = (t: string | null) => {
    const n = (t ?? "").replace(/\D/g, "");
    return n.length >= 10 ? `https://wa.me/${n.length <= 11 ? `55${n}` : n}` : null;
  };
  const itens = (itensRaw ?? []) as Item[];
  const movs = (movRaw ?? []) as Mov[];

  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const caixa = movs.reduce((s, m) => s + Number(m.valor), 0);
  const vendasMes = movs.filter((m) => m.tipo === "venda" && m.data >= `${hoje.slice(0, 8)}01`).reduce((s, m) => s + Number(m.valor), 0);
  const totCamisetas = itens.filter((i) => i.produto === "camiseta").reduce((s, i) => s + i.quantidade, 0);
  const totSqueeze = itens.filter((i) => i.produto === "squeeze").reduce((s, i) => s + i.quantidade, 0);

  const porNome = new Map(itens.map((i) => [i.nome, i]));
  const naMatriz = new Set<string>();
  const linhas = CORES.flatMap((cor) => ESTILOS.map((estilo) => ({ cor, estilo })));
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
            <div className="tile"><span className="k">Pedidos pendentes</span><span className="v">{pendentes.length}</span><span>{aguardando.length} aguardando Pix · {pagos.length} para entregar</span></div>
          </div>

          {/* PEDIDOS */}
          <h2 id="pedidos" style={{ marginTop: 56, fontSize: "clamp(26px,3.4vw,36px)" }}>Pedidos</h2>
          <p className="regra" style={{ marginTop: 8 }}>Pedidos feitos pelo site. Quando chegar o comprovante no WhatsApp, clique em “Pix recebido” (a venda entra no caixa). Ao entregar as peças, clique em “Entregue” (saem do estoque). Até lá, as peças ficam reservadas.</p>
          {pendentes.length === 0 && <p className="msg" style={{ marginTop: 14 }}>Nenhum pedido em aberto.</p>}
          {[
            { titulo: "Aguardando comprovante do Pix", lista: aguardando },
            { titulo: "Pagos · para entregar", lista: pagos },
          ].filter((g) => g.lista.length > 0).map((g) => (
            <div key={g.titulo}>
              <h3 className="pedidos-grupo">{g.titulo} ({g.lista.length})</h3>
              <div className="pedidos-lista">
                {g.lista.map((p) => (
                  <div key={p.id} className={`pedido-card${p.status === "pago" ? " pago" : ""}`}>
                    <div className="pedido-topo">
                      <b>#{p.codigo} · {p.nome}</b>
                      <span className="regra">{quandoBR(p.criado_em)}</span>
                    </div>
                    <p>{p.quantidade}x {p.item_nome} · <b>{reais(Number(p.valor))}</b>{p.pago_em ? <span className="regra"> · Pix em {quandoBR(p.pago_em)}</span> : null}</p>
                    <ul>
                      {p.pedido_itens.map((it, i) => (
                        <li key={i}>{it.descricao}{!it.estoque_item_id && <span className="regra"> (não está no estoque)</span>}</li>
                      ))}
                    </ul>
                    {p.observacao && <p className="regra">Obs.: {p.observacao}</p>}
                    <div className="pedido-acoes">
                      <form action="/treinador/loja/acao" method="post">
                        <input type="hidden" name="acao" value={p.status === "pendente" ? "pedido_pago" : "pedido_entregar"} />
                        <input type="hidden" name="ancora" value="pedidos" /><input type="hidden" name="id" value={p.id} />
                        <button className="btn btn-primary" type="submit">{p.status === "pendente" ? "Pix recebido" : "Entregue"}</button>
                      </form>
                      {p.status === "pendente" && (
                        <form action="/treinador/loja/acao" method="post">
                          <input type="hidden" name="acao" value="pedido_cancelar" /><input type="hidden" name="ancora" value="pedidos" /><input type="hidden" name="id" value={p.id} />
                          <button className="btn-link" type="submit">Cancelar</button>
                        </form>
                      )}
                      {zap(p.telefone) && <a className="btn-link" href={zap(p.telefone)!} target="_blank" rel="noopener noreferrer">WhatsApp do cliente</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {finalizados.length > 0 && (
            <details className="gerenciar" style={{ marginTop: 16 }}>
              <summary>Últimos pedidos finalizados</summary>
              <ul className="lista-remover">
                {finalizados.map((p) => (
                  <li key={p.id}>
                    <span>#{p.codigo} · {p.nome} · {p.quantidade}x {p.item_nome} · {reais(Number(p.valor))}</span>
                    <span className="regra">{p.status === "entregue" ? "Entregue" : "Cancelado"}{p.finalizado_em ? ` em ${quandoBR(p.finalizado_em)}` : ""}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* ESTOQUE */}
          <h2 id="estoque" style={{ marginTop: 56, fontSize: "clamp(26px,3.4vw,36px)" }}>Estoque</h2>
          {itens.length === 0 ? (
            <div className="strava-box" style={{ marginTop: 16 }}>
              <p>Comece criando a lista padrão: camisetas preta e branca, tradicional e baby look, do P ao GG, mais o squeeze. Depois é só contar.</p>
              <form action="/treinador/loja/acao" method="post">
                <input type="hidden" name="acao" value="semear" />
                <button className="btn btn-primary" type="submit">Criar lista padrão</button>
              </form>
            </div>
          ) : (
            <form action="/treinador/loja/acao" method="post" style={{ marginTop: 16 }}>
              <input type="hidden" name="acao" value="contagem" />
              <p className="regra">Faça a contagem e digite a quantidade de cada peça que está com você (incluindo as reservadas). Depois clique em “Salvar contagem”. “Reserv.” = peças em pedidos pendentes; em vermelho, faltam peças para atender.</p>
              <div style={{ overflowX: "auto", marginTop: 12 }}>
                <table className="tabela matriz">
                  <thead>
                    <tr><th>Camiseta</th>{TAMANHOS.map((t) => <th key={t}>{t}</th>)}<th>Total</th></tr>
                  </thead>
                  <tbody>
                    {linhas.map(({ cor, estilo }) => {
                      let total = 0;
                      return (
                        <tr key={`${cor}-${estilo}`}>
                          <td><span className={`bola-cor ${cor === "Preta" ? "preta" : "branca"}`} /> {cor} · {estilo}</td>
                          {TAMANHOS.map((t) => {
                            const it = porNome.get(nomeCamiseta(cor, estilo, t));
                            if (!it) return <td key={t}>—</td>;
                            naMatriz.add(it.id);
                            total += it.quantidade;
                            return (
                              <td key={t}>
                                <input className={`qtd${it.quantidade === 0 ? " zero" : ""}`} name={`q_${it.id}`} type="number" min={0} inputMode="numeric"
                                  defaultValue={it.quantidade} aria-label={`${cor} ${estilo} ${t}`} />
                                {reservado.get(it.id) ? (
                                  <span className={`reserva${(reservado.get(it.id) ?? 0) > it.quantidade ? " falta" : ""}`}>{reservado.get(it.id)} reserv.</span>
                                ) : null}
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
                      <span>{it.nome}{reservado.get(it.id) ? <span className={`reserva${(reservado.get(it.id) ?? 0) > it.quantidade ? " falta" : ""}`}> · {reservado.get(it.id)} reserv.</span> : null}</span>
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
                  <div className="field"><label htmlFor="e-estilo">Estilo</label><select id="e-estilo" name="estilo">{ESTILOS.map((c) => <option key={c} value={c}>{NOME_ESTILO[c]}</option>)}</select></div>
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
