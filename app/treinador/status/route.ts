import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

// Ativar / bloquear aluno (formulário simples, funciona mesmo sem JavaScript).
export async function POST(request: NextRequest) {
  const voltar = (q: string) => NextResponse.redirect(new URL(`/treinador${q}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar?voltar=/treinador", request.url), { status: 303 });
  if (sessao.perfil?.papel !== "treinador") return voltar("?erro=permissao");

  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!id || !["ativo", "pendente", "bloqueado"].includes(status)) return voltar("?erro=dados");

  const { data, error } = await sessao.supabase.from("perfis").update({ status }).eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("mudar status falhou", { id, status, error, linhas: data?.length });
    return voltar("?erro=salvar");
  }
  return voltar("?ok=1");
}
