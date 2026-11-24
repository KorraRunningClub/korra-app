import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { gerarAvisos } from "@/lib/personal";

export const metadata = { title: "Mensagens · Korrá Running Club" };

type Aviso = { id: string; titulo: string; texto: string | null; link: string | null; lida: boolean; criado_em: string };

export default async function MensagensPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/mensagens");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil, user } = sessao;
  await gerarAvisos(supabase, user.id).catch(() => {});
  const { data } = await supabase.from("notificacoes").select("id, titulo, texto, link, lida, criado_em").order("criado_em", { ascending: false }).limit(100);
  const avisos = (data ?? []) as Aviso[];
  const novas = avisos.filter((a) => !a.lida).length;
  const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="eyebrow">Só você vê</div>
          <h1 style={{ marginTop: 14 }}>Mensagens</h1>
          <p style={{ marginTop: 10 }}>Avisos automáticos do app, como planos de personal que vencem no dia seguinte.</p>
          {novas > 0 && (
            <form action="/treinador/mensagens/acao" method="post" style={{ marginTop: 14 }}>
              <input type="hidden" name="acao" value="todas" />
              <button className="btn btn-ghost" type="submit">Marcar todas como lidas ({novas})</button>
            </form>
          )}
          {avisos.length === 0 ? (
            <p className="msg" style={{ marginTop: 24 }}>Nenhuma mensagem por enquanto.</p>
          ) : (
            <ul className="avisos">
              {avisos.map((a) => (
                <li key={a.id} className={a.lida ? "lida" : "nova"}>
                  <div style={{ minWidth: 0 }}>
                    <b>{a.titulo}</b>
                    {a.texto && <p>{a.texto}</p>}
                    <span className="regra">{quando(a.criado_em)}</span>
                  </div>
                  <div className="avisos-acoes">
                    {a.link && <Link className="btn btn-primary" href={a.link}>Ver</Link>}
                    <form action="/treinador/mensagens/acao" method="post">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="acao" value={a.lida ? "apagar" : "ler"} />
                      <button className="btn-link" type="submit">{a.lida ? "Apagar" : "Marcar como lida"}</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
