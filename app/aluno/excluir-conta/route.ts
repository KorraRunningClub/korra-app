import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";

// LGPD (art. 18, VI): o aluno exclui a própria conta e os dados.
export async function POST(request: NextRequest) {
  const ir = (caminho: string) => NextResponse.redirect(new URL(caminho, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao) return ir("/entrar");
  if (sessao.perfil?.papel === "treinador") return ir("/aluno/cadastro?erro=treinador");

  const form = await request.formData();
  if (String(form.get("confirmar") ?? "").trim().toUpperCase() !== "EXCLUIR") {
    return ir("/aluno/cadastro?erro=confirmar#excluir");
  }

  try {
    const admin = createAdmin();
    const { data: c } = await admin.from("strava_conexoes").select("access_token").eq("user_id", sessao.user.id).maybeSingle();
    if (c) {
      await fetch("https://www.strava.com/oauth/deauthorize", {
        method: "POST",
        headers: { Authorization: `Bearer ${c.access_token}` },
      }).catch(() => {});
    }
    // Apaga fotos/vídeos do Diz Aí
    const { data: arquivos } = await admin.storage.from("diz-ai").list(sessao.user.id, { limit: 1000 });
    if (arquivos?.length) await admin.storage.from("diz-ai").remove(arquivos.map((a) => `${sessao.user.id}/${a.name}`));
    // Apaga o usuário do login; perfil, treinos e conexão são apagados em cascata.
    const { error } = await admin.auth.admin.deleteUser(sessao.user.id);
    if (error) throw error;
    await sessao.supabase.auth.signOut().catch(() => {});
    return ir("/?conta=excluida");
  } catch (e) {
    console.error("excluir conta", e);
    return ir("/aluno/cadastro?erro=excluir#excluir");
  }
}
