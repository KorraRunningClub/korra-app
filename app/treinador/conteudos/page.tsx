import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CATEGORIAS_FORUM, type CategoriaForum, quando, thumb } from "@/lib/forum";

export const metadata = { title: "Publicar vídeos · Korrá Running Club" };

const MSG: Record<string, string> = {
  link: "Não reconhecemos o link do YouTube. Copie o link do vídeo (ex.: https://youtu.be/abc123xyz00).",
  titulo: "Escreva um título com pelo menos 3 letras.",
  categoria: "Escolha a categoria.",
  erro: "Não conseguimos salvar. Tente de novo.",
};

export default async function ConteudosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/conteudos");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;
  const { erro, ok } = await searchParams;

  const { data: lista } = await supabase.from("conteudos")
    .select("id, aba, categoria, titulo, youtube_id, parceiro_nome, criado_em")
    .order("criado_em", { ascending: false });

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Painel do treinador</div>
          <h1 style={{ marginTop: 14 }}>Vídeos do fórum</h1>
          <p style={{ marginTop: 12 }}>
            Suba o vídeo no YouTube como <b>“Não listado”</b>, copie o link e cole aqui. Ele aparece na hora para os alunos ativos.
          </p>
          {ok && <p className="msg" style={{ marginTop: 16 }}>{ok === "apagado" ? "Vídeo removido." : "Vídeo publicado!"}</p>}
          {erro && <p className="msg erro" style={{ marginTop: 16 }}>{MSG[erro] ?? "Algo deu errado."}</p>}

          <div className="despesas-grid" style={{ marginTop: 24 }}>
            <form className="panel" action="/treinador/conteudos/acao" method="post">
              <input type="hidden" name="acao" value="criar" />
              <div className="field">
                <label htmlFor="c-categoria">Onde publicar</label>
                <select id="c-categoria" name="categoria" required defaultValue="">
                  <option value="" disabled>Escolha</option>
                  <optgroup label="Conteúdos">
                    <option value="tecnica">Técnica e educativos</option>
                    <option value="forca">Força e pliometria</option>
                  </optgroup>
                  <optgroup label="Dicas">
                    <option value="fisioterapia">Fisioterapia</option>
                    <option value="nutricao">Nutrição</option>
                    <option value="massoterapia">Massoterapia</option>
                    <option value="provas">Provas e equipamentos</option>
                  </optgroup>
                </select>
              </div>
              <div className="field">
                <label htmlFor="c-titulo">Título</label>
                <input id="c-titulo" name="titulo" required maxLength={140} placeholder="Ex.: Educativo de skipping" />
              </div>
              <div className="field">
                <label htmlFor="c-link">Link do YouTube</label>
                <input id="c-link" name="link" required placeholder="https://youtu.be/..." />
              </div>
              <div className="field">
                <label htmlFor="c-descricao">Descrição (opcional)</label>
                <textarea id="c-descricao" name="descricao" rows={3} maxLength={1500} placeholder="Como e quando fazer, séries, cuidados…" />
              </div>
              <div className="field">
                <label htmlFor="c-parceiro">Profissional parceiro (opcional)</label>
                <input id="c-parceiro" name="parceiro_nome" maxLength={80} placeholder="Ex.: Dra. Ana Souza, fisioterapeuta" />
              </div>
              <div className="field">
                <label htmlFor="c-insta">Instagram do parceiro (opcional)</label>
                <input id="c-insta" name="parceiro_instagram" maxLength={40} placeholder="@perfil" />
              </div>
              <button className="btn btn-primary" type="submit">Publicar vídeo →</button>
            </form>

            <div style={{ minWidth: 0 }}>
              {(lista ?? []).length === 0 ? (
                <p className="msg">Nenhum vídeo publicado ainda.</p>
              ) : (
                <ul className="admin-videos">
                  {(lista ?? []).map((v) => (
                    <li key={v.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb(v.youtube_id)} alt="" loading="lazy" />
                      <div style={{ minWidth: 0 }}>
                        <Link href={`/aluno/forum/${v.id}`}><b>{v.titulo}</b></Link>
                        <div className="sub">
                          {CATEGORIAS_FORUM[v.categoria as CategoriaForum]?.nome}
                          {v.parceiro_nome ? ` · ${v.parceiro_nome}` : ""} · {quando(v.criado_em)}
                        </div>
                      </div>
                      <form action="/treinador/conteudos/acao" method="post">
                        <input type="hidden" name="acao" value="apagar" />
                        <input type="hidden" name="id" value={v.id} />
                        <button className="btn-link" type="submit">Remover</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
