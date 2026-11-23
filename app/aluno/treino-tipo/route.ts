import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { ehCompanhia, ehTipoTreino } from "@/lib/treinos";

// Marca (ou desmarca) o tipo do treino ou com quem o aluno correu.
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "login" }, { status: 401 });
  const { supabase, user } = sessao;
  const corpo = (await request.json().catch(() => null)) as
    | { id?: number | string; campo?: string; valor?: string | null; tipo?: string | null }
    | null;
  const id = Number(corpo?.id);
  if (!Number.isFinite(id)) return NextResponse.json({ erro: "id" }, { status: 400 });
  const campo = corpo?.campo === "companhia" ? "companhia" : "tipo";
  const valor = (corpo?.valor ?? corpo?.tipo ?? null) || null;
  if (valor && !(campo === "tipo" ? ehTipoTreino(valor) : ehCompanhia(valor)))
    return NextResponse.json({ erro: "valor" }, { status: 400 });

  const { data: atv } = await supabase.from("atividades").select("id, inicio_local").eq("id", id).eq("user_id", user.id).single();
  if (!atv) return NextResponse.json({ erro: "atividade" }, { status: 404 });

  const { data: linha, error } = await supabase
    .from("treino_marcacoes")
    .upsert({ atividade_id: id, user_id: user.id, [campo]: valor, data: String(atv.inicio_local).slice(0, 10), marcado_em: new Date().toISOString() })
    .select("tipo, companhia")
    .single();
  if (error) {
    console.error("treino marcacao", error);
    return NextResponse.json({ erro: "salvar" }, { status: 500 });
  }
  // nada marcado: apaga a linha
  if (!linha.tipo && !linha.companhia) await supabase.from("treino_marcacoes").delete().eq("atividade_id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true, ...linha });
}
