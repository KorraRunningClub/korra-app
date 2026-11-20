import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

// LGPD (art. 18): o aluno baixa uma cópia dos próprios dados em JSON.
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar?voltar=/aluno/cadastro", request.url));
  const { supabase, user } = sessao;

  const [{ data: perfil }, { data: atividades }, { data: pagamentos }, { data: strava }] = await Promise.all([
    supabase.from("perfis").select("*").eq("id", user.id).single(),
    supabase.from("atividades").select("inicio_local, tipo, esteira, distancia_m, tempo_mov_s, tempo_total_s, nome, fonte").eq("user_id", user.id).order("inicio_local"),
    supabase.from("pagamentos").select("valor, vencimento, pago_em, forma, status").eq("aluno_id", user.id).order("vencimento"),
    supabase.rpc("strava_conectado"),
  ]);

  const dados = {
    gerado_em: new Date().toISOString(),
    controlador: "Arthur Passoni Canônica · Korrá Running Club · CREF 035416-G/SC",
    conta: { email: user.email, criada_em: user.created_at, ultimo_acesso: user.last_sign_in_at },
    cadastro: perfil,
    strava_conectado: Boolean(strava),
    corridas_importadas: atividades ?? [],
    mensalidades: pagamentos ?? [],
  };

  return new NextResponse(JSON.stringify(dados, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="meus-dados-korra.json"`,
      "Cache-Control": "no-store",
    },
  });
}
