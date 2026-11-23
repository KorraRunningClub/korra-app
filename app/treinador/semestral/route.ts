import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { recalcularSemestre, semestre } from "@/lib/semestral";

// Recalcula o ranking semestral de alguns alunos por vez (o Cloudflare limita chamadas por clique).
const POR_VEZ = 6;

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const ir = (q: string) => NextResponse.redirect(`${origin}/treinador${q}#strava`, { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return ir("?erro=permissao");

  const admin = createAdmin();
  const sem = semestre(0);
  const [{ data: conexoes }, { data: feitos }] = await Promise.all([
    admin.from("strava_conexoes").select("user_id"),
    admin.from("sequencias_semestre").select("user_id, atualizado_em").eq("semestre", sem.chave),
  ]);
  const quando = new Map((feitos ?? []).map((f) => [f.user_id as string, String(f.atualizado_em)]));
  const fila = (conexoes ?? [])
    .map((c) => c.user_id as string)
    .sort((a, b) => (quando.get(a) ?? "").localeCompare(quando.get(b) ?? ""));
  const desatualizados = fila.filter((u) => {
    const t = quando.get(u);
    return !t || Date.now() - new Date(t).getTime() > 6 * 3600 * 1000;
  });
  let feitosAgora = 0;
  for (const u of desatualizados.slice(0, POR_VEZ)) {
    try {
      await recalcularSemestre(admin, u);
      feitosAgora++;
    } catch (e) {
      console.error("semestral treinador", e);
    }
  }
  const restam = Math.max(0, desatualizados.length - POR_VEZ);
  return ir(`?ok=strava_semestral&feitos=${feitosAgora}&restam=${restam}`);
}
