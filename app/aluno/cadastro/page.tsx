import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { FormCadastro, type DadosCadastro } from "./FormCadastro";

export const metadata = { title: "Meu cadastro · Korrá Running Club" };

const ERROS: Record<string, string> = {
  confirmar: "Para excluir, digite EXCLUIR no campo e clique de novo.",
  excluir: "Não conseguimos excluir agora. Tente de novo ou fale com o treinador pelo WhatsApp.",
  treinador: "A conta do treinador não pode ser excluída por aqui.",
};

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/cadastro");
  const { supabase, user, perfil } = sessao;

  const { data } = await supabase
    .from("perfis")
    .select("nome, telefone, data_nascimento, objetivo, responsavel_nome, responsavel_telefone, consentimento_responsavel, autoriza_imagem, cadastro_completo")
    .eq("id", user.id)
    .single<DadosCadastro>();

  const dados: DadosCadastro = data ?? {
    nome: null, telefone: null, data_nascimento: null, objetivo: null,
    responsavel_nome: null, responsavel_telefone: null,
    consentimento_responsavel: false, autoriza_imagem: false, cadastro_completo: false,
  };

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={perfil?.papel === "treinador"} />
      <main className="app-shell">
        <div className="wrap" style={{ display: "grid", gap: "28px" }}>
          <div>
            <div className="eyebrow">{dados.cadastro_completo ? "Meus dados" : "Primeiro acesso"}</div>
            <h1 style={{ marginTop: "14px" }}>{dados.cadastro_completo ? "Meu cadastro" : "Falta pouco!"}</h1>
            <p style={{ marginTop: "14px" }}>
              {dados.cadastro_completo
                ? "Confira e atualize seus dados quando precisar."
                : "Antes de começar, conta pra gente um pouco sobre você. Leva menos de 1 minuto."}
            </p>
          </div>
          <FormCadastro dados={dados} />

          {dados.cadastro_completo && (
            <section className="zona-perigo" id="excluir" style={{ borderColor: "var(--line)" }}>
              <h2>Seus dados (LGPD)</h2>
              <p>
                Você pode baixar uma cópia de tudo o que a Korrá guarda sobre você ou excluir sua conta. Saiba mais na{" "}
                <a href="/privacidade">Política de Privacidade</a>.
              </p>
              <div className="linha">
                <a className="btn btn-ghost" href="/aluno/meus-dados">Baixar meus dados</a>
              </div>
              {perfil?.papel !== "treinador" && (
                <form action="/aluno/excluir-conta" method="post" className="linha" style={{ marginTop: "8px" }}>
                  <div className="field" style={{ flex: "1 1 220px" }}>
                    <label htmlFor="confirmar">Para excluir sua conta, digite EXCLUIR</label>
                    <input id="confirmar" name="confirmar" autoComplete="off" placeholder="EXCLUIR" />
                  </div>
                  <button className="btn btn-perigo" type="submit">Excluir minha conta</button>
                </form>
              )}
              {erro && <p className="msg erro">{ERROS[erro] ?? "Algo deu errado."}</p>}
              <p style={{ fontSize: "14px", opacity: 0.75 }}>
                A exclusão apaga cadastro, treinos importados e a conexão com o Strava. Não dá para desfazer.
              </p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
