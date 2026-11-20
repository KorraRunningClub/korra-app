import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";

// Depois do login: treinador vai para o painel, aluno para a área dele.
export default async function InicioPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  redirect(sessao.perfil?.papel === "treinador" ? "/treinador" : "/aluno");
}
