import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/AppHeader";
import { nomeCurto } from "@/lib/forum";
import { NovoPost } from "./NovoPost";

export const metadata = { title: "Diz Aí Como Foi · Korrá Running Club" };

type Post = {
  id: string; autor_nome: string; autor_treinador: boolean; meu: boolean; tipo: "foto" | "video";
  caminho: string; legenda: string | null; criado_em: string; reacoes: number; eu_reagi: boolean; comentarios: number;
};
type Com = { id: string; post_id: string; texto: string; criado_em: string; autor_nome: string; autor_treinador: boolean; meu: boolean };

function ha(iso: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return min < 60 ? `há ${min} min` : `há ${Math.floor(min / 60)} h`;
}
function restam(iso: string) {
  const h = Math.max(0, 24 - (Date.now() - new Date(iso).getTime()) / 3600000);
  return h < 1 ? "some em menos de 1 h" : `some em ${Math.floor(h)} h`;
}
const iniciais = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

// Apaga posts com mais de 24 h (registro e arquivo).
async function limparVencidos() {
  try {
    const admin = createAdmin();
    const limite = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data } = await admin.from("posts").select("id, caminho").lt("criado_em", limite).limit(50);
    if (!data?.length) return;
    await admin.storage.from("diz-ai").remove(data.map((p) => p.caminho));
    await admin.from("posts").delete().in("id", data.map((p) => p.id));
  } catch (e) {
    console.error("limpar diz-ai", e);
  }
}

export default async function DizAiPage({ searchParams }: { searchParams: Promise<{ abrir?: string }> }) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/diz-ai");
  const { supabase, user, perfil } = sessao;
  const treinador = perfil?.papel === "treinador";
  const liberado = perfil?.status === "ativo" || treinador;
  const { abrir } = await searchParams;

  let posts: Post[] = [];
  const urls = new Map<string, string>();
  const coms = new Map<string, Com[]>();
  if (liberado) {
    await limparVencidos();
    const { data } = await supabase.rpc("feed_diz_ai");
    posts = (data ?? []) as Post[];
    if (posts.length) {
      const { data: assinadas } = await createAdmin().storage.from("diz-ai").createSignedUrls(posts.map((p) => p.caminho), 3600);
      for (const s of assinadas ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
      const comComentario = posts.filter((p) => Number(p.comentarios) > 0);
      const listas = await Promise.all(comComentario.map((p) => supabase.rpc("comentarios_post", { p_post: p.id })));
      comComentario.forEach((p, i) => coms.set(p.id, (listas[i].data ?? []) as Com[]));
    }
  }
  const autores = [...new Map(posts.map((p) => [p.autor_nome, p])).values()];

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={treinador} />
      <main className="app-shell">
        <div className="wrap diz-ai">
          <div className="eyebrow">Comunidade Korrá</div>
          <h1 style={{ marginTop: 14 }}>Diz aí, como foi?</h1>
          <p style={{ marginTop: 10 }}>Terminou o treino? Posta uma foto ou um vídeo curto. Tudo some em 24 horas.</p>

          {!liberado ? (
            <p className="msg" style={{ marginTop: 24 }}>A comunidade libera assim que sua matrícula estiver ativa.</p>
          ) : (
            <>
              {autores.length > 0 && (
                <div className="bolhas" aria-label="Quem postou hoje">
                  {autores.map((p) => (
                    <a key={p.id} href={`#p-${p.id}`} className="bolha">
                      <span className="bolha-anel"><span>{iniciais(p.autor_nome)}</span></span>
                      <span className="bolha-nome">{p.autor_treinador ? "Treinador" : nomeCurto(p.autor_nome).split(" ")[0]}</span>
                    </a>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 22 }}><NovoPost userId={user.id} /></div>

              {posts.length === 0 ? (
                <p className="msg" style={{ marginTop: 24 }}>Ninguém postou nas últimas 24 horas. Que tal ser o primeiro?</p>
              ) : (
                <div className="feed">
                  {posts.map((p) => {
                    const url = urls.get(p.caminho);
                    const lista = coms.get(p.id) ?? [];
                    return (
                      <article key={p.id} id={`p-${p.id}`} className="post">
                        <header className="post-topo">
                          <span className="avatar">{iniciais(p.autor_nome)}</span>
                          <span style={{ minWidth: 0 }}>
                            <b>{p.autor_treinador ? p.autor_nome : nomeCurto(p.autor_nome)}</b>
                            {p.autor_treinador && <span className="pill" style={{ marginLeft: 8 }}>Treinador</span>}
                            <span className="post-quando">{ha(p.criado_em)} · {restam(p.criado_em)}</span>
                          </span>
                          {(p.meu || treinador) && (
                            <form action="/aluno/diz-ai/apagar" method="post" style={{ marginLeft: "auto" }}>
                              <input type="hidden" name="post_id" value={p.id} />
                              <button className="btn-link" type="submit">Apagar</button>
                            </form>
                          )}
                        </header>
                        <div className="post-midia">
                          {!url ? <span className="regra">Mídia indisponível</span> : p.tipo === "video" ? (
                            <video src={url} controls playsInline preload="metadata" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt={p.legenda ?? "Foto do treino"} loading="lazy" />
                          )}
                        </div>
                        {p.legenda && <p className="post-legenda">{p.legenda}</p>}
                        <div className="post-acoes">
                          <form action="/aluno/diz-ai/reagir" method="post">
                            <input type="hidden" name="post_id" value={p.id} />
                            <input type="hidden" name="ja" value={p.eu_reagi ? "1" : "0"} />
                            <button type="submit" className={`fogo${p.eu_reagi ? " on" : ""}`} aria-pressed={p.eu_reagi}>
                              🔥 <span>{Number(p.reacoes) || ""}</span>
                            </button>
                          </form>
                          <span className="regra">{Number(p.comentarios) ? `${p.comentarios} comentário${Number(p.comentarios) > 1 ? "s" : ""}` : "Sem comentários"}</span>
                        </div>
                        <details className="post-coms" open={abrir === p.id}>
                          <summary>{lista.length ? "Ver comentários" : "Comentar"}</summary>
                          {lista.length > 0 && (
                            <ul>
                              {lista.map((c) => (
                                <li key={c.id}>
                                  <b>{c.autor_treinador ? c.autor_nome : nomeCurto(c.autor_nome)}</b>{" "}
                                  {c.texto}
                                  {(c.meu || treinador) && (
                                    <form action="/aluno/diz-ai/comentar" method="post" style={{ display: "inline" }}>
                                      <input type="hidden" name="acao" value="apagar" />
                                      <input type="hidden" name="post_id" value={p.id} />
                                      <input type="hidden" name="id" value={c.id} />
                                      <button className="btn-link" type="submit" style={{ marginLeft: 8, fontSize: 13 }}>apagar</button>
                                    </form>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          <form action="/aluno/diz-ai/comentar" method="post" className="post-comentar">
                            <input type="hidden" name="post_id" value={p.id} />
                            <input name="texto" maxLength={500} required placeholder="Manda a real…" aria-label="Comentário" />
                            <button className="btn btn-primary" type="submit">Enviar</button>
                          </form>
                        </details>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
