import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return new NextResponse("login", { status: 401 });
  const { caminho, tipo, legenda } = (await request.json().catch(() => ({}))) as Record<string, string>;
  if (!caminho?.startsWith(`${sessao.user.id}/`) || !["foto", "video"].includes(tipo)) {
    return new NextResponse("dados inválidos", { status: 400 });
  }
  const { error } = await sessao.supabase.from("posts").insert({
    autor_id: sessao.user.id,
    tipo,
    caminho,
    legenda: (legenda ?? "").trim().slice(0, 300) || null,
  });
  if (error) {
    console.error("postar", error);
    return new NextResponse("erro", { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
