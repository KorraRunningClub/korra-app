import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";

// Liga o aviso automático (webhook) do Strava. Basta fazer uma vez.
export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const ir = (q: string) => NextResponse.redirect(`${origin}/treinador${q}#strava`, { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return ir("?erro=permissao");

  const base = { client_id: process.env.STRAVA_CLIENT_ID!, client_secret: process.env.STRAVA_CLIENT_SECRET! };
  const lista = await fetch(`https://www.strava.com/api/v3/push_subscriptions?${new URLSearchParams(base)}`);
  if (lista.ok && ((await lista.json()) as unknown[]).length > 0) return ir("?ok=strava_ja");

  const r = await fetch("https://www.strava.com/api/v3/push_subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...base,
      callback_url: `${origin}/strava/webhook`,
      verify_token: process.env.STRAVA_VERIFY_TOKEN ?? "",
    }),
  });
  if (!r.ok) {
    console.error("strava webhook criar", r.status, await r.text());
    return ir("?erro=strava_webhook");
  }
  return ir("?ok=strava_webhook");
}
