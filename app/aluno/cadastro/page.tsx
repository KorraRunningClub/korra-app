import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { FormCadastro, type DadosCadastro } from "./FormCadastro";

export const metadata = { title: "Meu cadastro · Korrá Running Club" };

export default async function CadastroPage() {
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
        </div>
      </main>
    </>
  );
}
