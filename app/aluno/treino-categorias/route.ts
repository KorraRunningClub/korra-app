import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { ehCategoriaCompl } from "@/lib/treinos";

// Salva as categorias (força, flexibilidade, pliometria, potência) de um treino complementar do próprio aluno.
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "login" }, { status: 401 });
  const corpo = (await request.json().catch(() => null)) as { id?: string; categorias?: string[] } | null;
  const categorias = [...new Set((corpo?.categorias ?? []).filter(ehCategoriaCompl))];
  if (!corpo?.id) return NextResponse.json({ erro: "id" }, { status: 400 });
  const { error } = await sessao.supabase.from("treinos_extras").update({ categorias }).eq("id", corpo.id).eq("user_id", sessao.user.id);
  if (error) {
    console.error("categorias", error);
    return NextResponse.json({ erro: "salvar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, categorias });
}
