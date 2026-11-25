import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { FormTreino } from "./FormTreino";
import {
  FASES_TREINO, NIVEIS, SUBTIPOS, TIPOS, descansoTxt, qtd, seriesDo, seriesTxt, tempoNoPace, tempoTxt, totalSerie, zonaNome,
  type Bloco, type FaseTreino, type TreinoModelo,
} from "@/lib/biblioteca";
import { calcularZonas, mmss, type Teste } from "@/lib/zonas";

export const metadata = { title: "Biblioteca de treinos · Korrá Running Club" };

const OK: Record<string, string> = { salvo: "Treino salvo na biblioteca.", apagado: "Treino removido." };
const ERRO: Record<string, string> = { dados: "Confira os blocos do treino (quanto, unidade e zona).", tabela: "Falta rodar o SQL da biblioteca no Supabase.", salvar: "Não conseguimos salvar. Tente de novo." };
const ORDEM_NIVEL = { iniciante: 0, intermediario: 1, avancado: 2, todos: 3 } as const;

export default async function Biblioteca({ searchParams }: { searchParams: Promise<{ fase?: string; atleta?: string; editar?: string; novo?: string; tipo?: string; subtipo?: string; ok?: string; erro?: string }> }) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/treinos");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;
  const q = await searchParams;
  const fase: FaseTreino = q.fase && q.fase in FASES_TREINO ? (q.fase as FaseTreino) : "base";

  const [{ data: tr }, { data: alunos }] = await Promise.all([
    supabase.from("treinos_modelo").select("id, fase, nivel, nome, tipo, subtipo, estrutura, obs, ordem").order("ordem").order("nome"),
    supabase.from("perfis").select("id, nome").eq("status", "ativo").order("nome"),
  ]);
  const todos = ((tr ?? []) as TreinoModelo[]).filter((t) => t.estrutura && Object.keys(t.estrutura).length);
  const daFase = todos.filter((t) => t.fase === fase);
  const editando = q.editar ? todos.find((t) => t.id === q.editar) ?? null : null;
  const novo = q.novo === "1";

  let zonasAtleta: ReturnType<typeof calcularZonas> | null = null;
  let nomeAtleta = "";
  if (q.atleta) {
    const { data: t } = await supabase.from("testes_zonas").select("teste, tempo_s").eq("user_id", q.atleta)
      .order("data", { ascending: false }).order("criado_em", { ascending: false }).limit(1).maybeSingle<{ teste: Teste; tempo_s: number }>();
    if (t) zonasAtleta = calcularZonas(t.teste, t.tempo_s);
    nomeAtleta = (alunos ?? []).find((a) => a.id === q.atleta)?.nome ?? "";
  }
  const base = `/treinador/treinos?fase=${fase}${q.atleta ? `&atleta=${q.atleta}` : ""}`;

  // um bloco do treino com o pace do atleta (se escolhido)
  const linhaBloco = (b: Bloco, prefixo?: string) => {
    const z = zonasAtleta?.zonas[b.zona - 1];
    const tempoTiro = z ? [tempoNoPace(b, z.paceLento), tempoNoPace(b, z.paceRapido)] : null;
    return (
      <>
        {prefixo}<b>{qtd(b)}</b> em <span className={`zona-${b.zona}`}><span className="zona-num">Z{b.zona}</span></span> {zonaNome(b.zona).replace(/^Z\d /, "")}
        {z && <span className="bib-pace"> · {mmss(z.paceLento)} a {mmss(z.paceRapido)}/km{tempoTiro?.[0] ? ` (${tempoTiro[0]} a ${tempoTiro[1]} cada)` : ""}</span>}
      </>
    );
  };

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Só você vê</div>
          <h1 style={{ marginTop: 14 }}>Biblioteca de treinos</h1>
          <p style={{ marginTop: 10, maxWidth: 720 }}>Monte os treinos-chave da Metodologia Korrá por fase e nível. Escolha um atleta para ver os paces calculados pelo VDOT dele.</p>
          {q.ok && <p className="msg" style={{ marginTop: 14 }}>{OK[q.ok] ?? "Pronto."}</p>}
          {q.erro && <p className="msg erro" style={{ marginTop: 14 }}>{ERRO[q.erro] ?? "Algo deu errado."}</p>}

          <div className="bib-topo">
            <div className="forum-abas" role="tablist">
              {Object.entries(FASES_TREINO).map(([k, f]) => (
                <Link key={k} role="tab" aria-selected={fase === k} className={`forum-aba${fase === k ? " ativa" : ""}`}
                  href={`/treinador/treinos?fase=${k}${q.atleta ? `&atleta=${q.atleta}` : ""}`}>{f.nome}</Link>
              ))}
            </div>
            <form method="get" action="/treinador/treinos" className="bib-atleta">
              <input type="hidden" name="fase" value={fase} />
              <select name="atleta" defaultValue={q.atleta ?? ""} aria-label="Atleta">
                <option value="">Paces de um atleta…</option>
                {(alunos ?? []).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <button className="btn btn-ghost" type="submit">Ver</button>
            </form>
          </div>
          <p className="regra" style={{ marginTop: 10 }}>{FASES_TREINO[fase].desc}
            {q.atleta && (zonasAtleta ? ` Paces de ${nomeAtleta} (VDOT ${zonasAtleta.vdot.toFixed(1).replace(".", ",")}).` : ` ${nomeAtleta} ainda não tem teste lançado.`)}
          </p>
          <Link className="btn btn-primary" href={`${base}&novo=1`} style={{ marginTop: 14, display: "inline-block" }}>+ Novo treino</Link>

          <div className="pastas">
            {(["regenerativo", "rodagem", "intervalado", "longo"] as const).map((tp) => {
              const doTipo = daFase.filter((t) => t.tipo === tp);
              const subpastas = tp === "intervalado" ? (Object.keys(SUBTIPOS) as (keyof typeof SUBTIPOS)[]) : [null];
              return (
                <details key={tp} className="pasta" open={doTipo.length > 0}>
                  <summary>
                    <span className="pasta-icone" aria-hidden="true">📁</span> {TIPOS[tp]} <span className="pasta-conta">{doTipo.length}</span>
                  </summary>
                  <div className="pasta-corpo">
                    {subpastas.map((sub) => {
                      const lista = doTipo.filter((t) => (sub ? t.subtipo === sub : true)).sort((x, y) => x.nome.localeCompare(y.nome) || ORDEM_NIVEL[x.nivel] - ORDEM_NIVEL[y.nivel]);
                      const novoHref = `${base}&novo=1&tipo=${tp}${sub ? `&subtipo=${sub}` : ""}`;
                      const conteudo = (
                        <>
                          {lista.length === 0 ? <p className="regra">Nenhum treino aqui ainda.</p> : (
                            <div className="bib-grid">
                              {lista.map((t) => {
                  const e = t.estrutura;
                  return (
                    <div key={t.id} className="bib-card">
                      <span className={`bib-nivel ${t.nivel}`}>{NIVEIS[t.nivel]}</span>
                      {t.tipo !== "intervalado" && e.principal ? (
                        <p className="bib-unico">{linhaBloco(e.principal)}</p>
                      ) : (
                        <ol className="bib-estrutura">
                          {e.aquecimento && <li><span className="bib-rot">Aquecimento</span> {linhaBloco(e.aquecimento)}</li>}
                          {e.strides && <li><span className="bib-rot">Strides</span> {linhaBloco(e.strides)}</li>}
                          {e.strides && e.descanso_strides_s ? <li><span className="bib-rot">Descanso</span> {tempoTxt(e.descanso_strides_s)}</li> : null}
                          {seriesDo(e).map((sr, i, arr) => (
                            <li key={i} className="bib-serie"><span className="bib-rot">Série principal{arr.length > 1 ? ` ${i + 1}` : ""}</span> {linhaBloco(sr, `${seriesTxt(sr)} × `)}
                              {sr.descanso_s ? <><br /><span className="regra">Descanso entre as repetições: {descansoTxt(sr.descanso_s, sr.descanso_max_s)}</span></> : null}
                              {sr.descanso_depois_s ? <><br /><span className="regra">Depois: {tempoTxt(sr.descanso_depois_s)} de descanso antes da próxima série</span></> : null}
                              <br /><span className="regra">Total: {totalSerie(sr)}</span>
                            </li>
                          ))}
                          {e.volta_calma && <li><span className="bib-rot">Volta à calma</span> {linhaBloco(e.volta_calma)}</li>}
                        </ol>
                      )}
                      {t.obs && <p className="regra">{t.obs}</p>}
                      <div className="ev-admin">
                        <Link className="btn-link" href={`${base}&editar=${t.id}`}>Editar</Link>
                        <form action="/treinador/treinos/acao" method="post">
                          <input type="hidden" name="acao" value="apagar" /><input type="hidden" name="id" value={t.id} /><input type="hidden" name="fase" value={fase} />
                          {q.atleta && <input type="hidden" name="atleta" value={q.atleta} />}
                          <button className="btn-link" type="submit">Remover</button>
                        </form>
                      </div>
                    </div>
                  );
                              })}
                            </div>
                          )}
                          <Link className="btn-link pasta-novo" href={novoHref}>+ Adicionar {sub ? SUBTIPOS[sub].toLowerCase() : TIPOS[tp].toLowerCase()}</Link>
                        </>
                      );
                      return sub ? (
                        <details key={sub} className="pasta sub" open={lista.length > 0}>
                          <summary><span className="pasta-icone" aria-hidden="true">📂</span> {SUBTIPOS[sub]} <span className="pasta-conta">{lista.length}</span></summary>
                          <div className="pasta-corpo">{conteudo}</div>
                        </details>
                      ) : <div key="unica">{conteudo}</div>;
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        {(novo || editando) && (
          <div className="modal-fundo">
            <Link className="modal-fora" href={base} aria-label="Fechar" />
            <div className="modal modal-largo" role="dialog" aria-modal="true" aria-label={editando ? "Editar treino" : "Novo treino"}>
              <Link className="modal-x" href={base} aria-label="Fechar">×</Link>
              <h2>{editando ? "Editar treino" : "Novo treino"}</h2>
              <FormTreino treino={editando} fase={fase} atleta={q.atleta} voltar={base} tipoInicial={q.tipo} subtipoInicial={q.subtipo} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
