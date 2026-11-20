import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { ABAS, CATEGORIAS_FORUM, type Aba, type CategoriaForum, quando, thumb } from "@/lib/forum";

export const metadata = { title: "Fórum · Korrá Running Club" };

type Conteudo = {
  id: string; aba: Aba; categoria: CategoriaForum; titulo: string; youtube_id: string;
  parceiro_nome: string | null; criado_em: string;
};

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; cat?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/forum");
  const { supabase, user, perfil } = sessao;
  const treinador = perfil?.papel === "treinador";
  const liberado = perfil?.status === "ativo" || treinador;
  const q = await searchParams;
  const aba: Aba = q.aba === "dicas" ? "dicas" : "conteudos";
  const cats = Object.entries(CATEGORIAS_FORUM).filter(([, c]) => c.aba === aba) as [CategoriaForum, { nome: string }][];
  const cat = cats.find(([k]) => k === q.cat)?.[0];

  let itens: Conteudo[] = [];
  if (liberado) {
    let consulta = supabase.from("conteudos")
      .select("id, aba, categoria, titulo, youtube_id, parceiro_nome, criado_em")
      .eq("aba", aba).order("criado_em", { ascending: false });
    if (cat) consulta = consulta.eq("categoria", cat);
    const { data } = await consulta;
    itens = (data ?? []) as Conteudo[];
  }

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={treinador} />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Fórum Korrá</div>
          <h1 style={{ marginTop: 14 }}>{aba === "dicas" ? "Dicas" : "Conteúdos"}</h1>
          <p style={{ marginTop: 12 }}>
            {aba === "dicas"
              ? "Fisioterapia, nutrição, massoterapia e tudo sobre provas e equipamentos, com os nossos parceiros."
              : "Técnica de corrida, educativos e o trabalho de força que faz você correr melhor."}
          </p>

          {!liberado ? (
            <p className="msg" style={{ marginTop: 24 }}>Os conteúdos liberam assim que sua matrícula estiver ativa.</p>
          ) : (
            <>
              <div className="forum-abas" role="tablist">
                {(Object.keys(ABAS) as Aba[]).map((a) => (
                  <Link key={a} href={`/aluno/forum?aba=${a}`} role="tab" aria-selected={a === aba} className={`forum-aba${a === aba ? " ativa" : ""}`}>
                    {ABAS[a]}
                  </Link>
                ))}
                {treinador && <Link className="forum-publicar" href="/treinador/conteudos">+ Publicar vídeo</Link>}
              </div>

              <div className="chips">
                <Link href={`/aluno/forum?aba=${aba}`} className={`chip${!cat ? " ativo" : ""}`}>Todos</Link>
                {cats.map(([k, c]) => (
                  <Link key={k} href={`/aluno/forum?aba=${aba}&cat=${k}`} className={`chip${cat === k ? " ativo" : ""}`}>{c.nome}</Link>
                ))}
              </div>

              {itens.length === 0 ? (
                <p className="msg" style={{ marginTop: 20 }}>
                  Nenhum vídeo aqui ainda.{treinador ? " Publique o primeiro em “+ Publicar vídeo”." : " Em breve tem novidade."}
                </p>
              ) : (
                <div className="videos">
                  {itens.map((v) => (
                    <Link key={v.id} href={`/aluno/forum/${v.id}`} className="video-card">
                      <span className="video-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb(v.youtube_id)} alt="" loading="lazy" />
                        <span className="play" aria-hidden="true">▶</span>
                      </span>
                      <span className="video-info">
                        <span className="video-cat">{CATEGORIAS_FORUM[v.categoria]?.nome}</span>
                        <span className="video-titulo">{v.titulo}</span>
                        <span className="video-meta">{v.parceiro_nome ? `${v.parceiro_nome} · ` : ""}{quando(v.criado_em)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
