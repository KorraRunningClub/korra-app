import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { ehTipoTreino } from "@/lib/treinos";

// Marca (ou desmarca) o tipo de um treino do próprio aluno.
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "login" }, { status: 401 });
  const { supabase, user } = sessao;
  const corpo = (await request.json().catch(() => null)) as { id?: number | string; tipo?: string | null } | null;
  const id = Number(corpo?.id);
  if (!Number.isFinite(id)) return NextResponse.json({ erro: "id" }, { status: 400 });

  const { data: atv } = await supabase.from("atividades").select("id, inicio_local").eq("id", id).eq("user_id", user.id).single();
  if (!atv) return NextResponse.json({ erro: "atividade" }, { status: 404 });

  if (!corpo?.tipo) {
    const { error } = await supabase.from("treino_marcacoes").delete().eq("atividade_id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ erro: "salvar" }, { status: 500 });
    return NextResponse.json({ ok: true, tipo: null });
  }
  if (!ehTipoTreino(corpo.tipo)) return NextResponse.json({ erro: "tipo" }, { status: 400 });
  const { error } = await supabase.from("treino_marcacoes").upsert({
    atividade_id: id,
    user_id: user.id,
    tipo: corpo.tipo,
    data: String(atv.inicio_local).slice(0, 10),
    marcado_em: new Date().toISOString(),
  });
  if (error) {
    console.error("treino tipo", error);
    return NextResponse.json({ erro: "salvar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, tipo: corpo.tipo });
}
