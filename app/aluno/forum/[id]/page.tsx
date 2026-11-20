import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CATEGORIAS_FORUM, type CategoriaForum, nomeCurto, quando } from "@/lib/forum";

type Comentario = {
  id: string; pai_id: string | null; texto: string; criado_em: string;
  autor_nome: string; autor_treinador: boolean; meu: boolean;
};

const MSG: Record<string, string> = {
  vazio: "Escreva alguma coisa antes de enviar.",
  longo: "O comentário pode ter até 1.000 caracteres.",
  erro: "Não conseguimos salvar. Tente de novo.",
};

function Item({ c, treinador, conteudoId, respostas }: { c: Comentario; treinador: boolean; conteudoId: string; respostas?: Comentario[] }) {
  return (
    <li className="comentario">
      <div className="comentario-topo">
        <b>{c.autor_treinador ? c.autor_nome : nomeCurto(c.autor_nome)}</b>
        {c.autor_treinador && <span className="pill">Treinador</span>}
        <span className="quando">{quando(c.criado_em)}</span>
      </div>
      <p>{c.texto}</p>
      <div className="comentario-acoes">
        {!c.pai_id && (
          <details>
            <summary>Responder</summary>
            <form action="/aluno/forum/comentar" method="post" className="form-comentario">
              <input type="hidden" name="conteudo_id" value={conteudoId} />
              <input type="hidden" name="pai_id" value={c.id} />
              <textarea name="texto" rows={2} maxLength={1000} required placeholder="Escreva sua resposta" />
              <button className="btn btn-primary" type="submit">Responder</button>
            </form>
          </details>
        )}
        {(c.meu || treinador) && (
          <form action="/aluno/forum/comentar" method="post">
            <input type="hidden" name="acao" value="apagar" />
            <input type="hidden" name="conteudo_id" value={conteudoId} />
            <input type="hidden" name="id" value={c.id} />
            <button className="btn-link" type="submit">Apagar</button>
          </form>
        )}
      </div>
      {respostas && respostas.length > 0 && (
        <ul className="respostas">
          {respostas.map((r) => <Item key={r.id} c={r} treinador={treinador} conteudoId={conteudoId} />)}
        </ul>
      )}
    </li>
  );
}

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const sessao = await getSessao();
  if (!sessao) redirect(`/entrar?voltar=/aluno/forum/${id}`);
  const { supabase, user, perfil } = sessao;
  const treinador = perfil?.papel === "treinador";
  if (!(perfil?.status === "ativo" || treinador)) redirect("/aluno/forum");

  const { data: v } = await supabase.from("conteudos").select("*").eq("id", id).maybeSingle();
  if (!v) notFound();
  const { data: lista } = await supabase.rpc("comentarios_do_conteudo", { p_conteudo: id });
  const comentarios = (lista ?? []) as Comentario[];
  const raiz = comentarios.filter((c) => !c.pai_id);
  const filhos = (pid: string) => comentarios.filter((c) => c.pai_id === pid);
  const insta = v.parceiro_instagram?.replace(/^@/, "");

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={treinador} />
      <main className="app-shell">
        <div className="wrap video-pagina">
          <Link className="voltar" href={`/aluno/forum?aba=${v.aba}`}>← Voltar para {v.aba === "dicas" ? "Dicas" : "Conteúdos"}</Link>
          <div className="eyebrow" style={{ marginTop: 18 }}>{CATEGORIAS_FORUM[v.categoria as CategoriaForum]?.nome}</div>
          <h1 className="video-h1">{v.titulo}</h1>
          {v.parceiro_nome && (
            <p className="parceiro">
              Com <b>{v.parceiro_nome}</b>
              {insta && <> · <a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer">@{insta}</a></>}
            </p>
          )}

          <div className="player">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}?rel=0&modestbranding=1`}
              title={v.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
          {v.descricao && <p className="video-descricao">{v.descricao}</p>}

          <section className="comentarios" id="comentarios">
            <h2>Dúvidas e comentários{comentarios.length ? ` (${comentarios.length})` : ""}</h2>
            <form action="/aluno/forum/comentar" method="post" className="form-comentario">
              <input type="hidden" name="conteudo_id" value={id} />
              <textarea name="texto" rows={3} maxLength={1000} required placeholder="Ficou com alguma dúvida? Pergunta aqui." />
              <button className="btn btn-primary" type="submit">Comentar</button>
            </form>
            {erro && <p className="msg erro">{MSG[erro] ?? "Algo deu errado."}</p>}
            {raiz.length === 0 ? (
              <p className="regra">Ninguém comentou ainda. Comece a conversa!</p>
            ) : (
              <ul className="lista-comentarios">
                {raiz.map((c) => <Item key={c.id} c={c} treinador={treinador} conteudoId={id} respostas={filhos(c.id)} />)}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
