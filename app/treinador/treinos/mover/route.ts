import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { FASES_TREINO, SUBTIPOS, TIPOS } from "@/lib/biblioteca";

// Copia ou move um treino da biblioteca para outra pasta (tipo/subtipo) ou outra fase.
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.json({ erro: "acesso" }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as { id?: string; acao?: string; fase?: string; tipo?: string; subtipo?: string | null };
  const db = sessao.supabase.from("treinos_modelo");
  const { data: t } = await db.select("*").eq("id", String(b.id ?? "")).maybeSingle();
  if (!t) return NextResponse.json({ erro: "treino" }, { status: 404 });

  const fase = b.fase && b.fase in FASES_TREINO ? b.fase : t.fase;
  let tipo = t.tipo as string, subtipo = t.subtipo as string | null;
  if (b.tipo) {
    if (!(b.tipo in TIPOS)) return NextResponse.json({ erro: "dados" }, { status: 400 });
    // intervalado só troca de subpasta; os outros três trocam entre si
    if ((t.tipo === "intervalado") !== (b.tipo === "intervalado")) return NextResponse.json({ erro: "formato" }, { status: 400 });
    tipo = b.tipo;
    subtipo = b.tipo === "intervalado" ? (b.subtipo && b.subtipo in SUBTIPOS ? b.subtipo : t.subtipo) : null;
  }
  const mesmoLugar = fase === t.fase && tipo === t.tipo && subtipo === t.subtipo;

  if (b.acao === "copiar") {
    const { error } = await db.insert({
      fase, tipo, subtipo, nivel: t.nivel, estrutura: t.estrutura, obs: t.obs, ordem: t.ordem,
      nome: mesmoLugar ? `${t.nome} (cópia)`.slice(0, 80) : t.nome,
    });
    if (error) return NextResponse.json({ erro: "salvar" }, { status: 500 });
  } else if (b.acao === "mover") {
    if (!mesmoLugar) {
      const { error } = await db.update({ fase, tipo, subtipo }).eq("id", t.id);
      if (error) return NextResponse.json({ erro: "salvar" }, { status: 500 });
    }
  } else return NextResponse.json({ erro: "acao" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
