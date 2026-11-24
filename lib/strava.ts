import type { SupabaseClient } from "@supabase/supabase-js";

const API = "https://www.strava.com/api/v3";
const TIPOS_CORRIDA = new Set(["Run", "TrailRun", "VirtualRun"]);
// Treinos de força/complementares do Strava → entram como "treino extra" (ranking Força / compl. e ciclo)
const COMPLEMENTARES: Record<string, "forca" | "mobilidade" | "outro"> = {
  WeightTraining: "forca", Crossfit: "forca", HighIntensityIntervalTraining: "forca",
  Yoga: "mobilidade", Pilates: "mobilidade", Workout: "outro",
};

function paraExtra(a: AtividadeStrava, userId: string) {
  const tipo = COMPLEMENTARES[a.sport_type || a.type];
  if (!tipo) return null;
  return { user_id: userId, data: a.start_date_local.slice(0, 10), tipo, descricao: a.name?.slice(0, 120) ?? null, strava_id: a.id };
}

export function stravaConfigurado() {
  return Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET && process.env.SUPABASE_SECRET_KEY);
}

export function urlAutorizacao(origin: string, state: string) {
  const p = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${origin}/strava/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
    state,
  });
  return `https://www.strava.com/oauth/authorize?${p}`;
}

type Token = { access_token: string; refresh_token: string; expires_at: number; athlete?: { id: number } };

async function pedirToken(corpo: Record<string, string>): Promise<Token> {
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      ...corpo,
    }),
  });
  if (!r.ok) throw new Error(`Strava token ${r.status}: ${await r.text()}`);
  return r.json();
}

export const trocarCodigo = (code: string) => pedirToken({ code, grant_type: "authorization_code" });

/** Token válido do aluno (renova sozinho quando vence). */
export async function tokenDoAluno(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data: c } = await admin.from("strava_conexoes").select("*").eq("user_id", userId).single();
  if (!c) return null;
  if (c.expires_at - 120 > Date.now() / 1000) return c.access_token;
  const t = await pedirToken({ refresh_token: c.refresh_token, grant_type: "refresh_token" });
  await admin
    .from("strava_conexoes")
    .update({ access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at })
    .eq("user_id", userId);
  return t.access_token;
}

type AtividadeStrava = {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  trainer?: boolean;
};

function paraLinha(a: AtividadeStrava, userId: string) {
  const tipo = a.sport_type || a.type;
  if (!TIPOS_CORRIDA.has(tipo) || !a.distance || !a.moving_time) return null;
  return {
    id: a.id,
    user_id: userId,
    fonte: "strava",
    inicio_local: a.start_date_local.replace("Z", ""),
    tipo,
    esteira: Boolean(a.trainer) || tipo === "VirtualRun",
    distancia_m: Math.round(a.distance),
    tempo_mov_s: a.moving_time,
    tempo_total_s: a.elapsed_time,
    nome: a.name?.slice(0, 120) ?? null,
    atualizado_em: new Date().toISOString(),
  };
}

/** Importa as corridas dos últimos `dias` dias. Devolve quantas entraram. */
export async function importarRecentes(admin: SupabaseClient, userId: string, dias = 35) {
  const token = await tokenDoAluno(admin, userId);
  if (!token) return 0;
  const depois = Math.floor(Date.now() / 1000) - dias * 86400;
  const linhas: NonNullable<ReturnType<typeof paraLinha>>[] = [];
  const extras: NonNullable<ReturnType<typeof paraExtra>>[] = [];
  for (let pagina = 1; pagina <= 3; pagina++) {
    const r = await fetch(`${API}/athlete/activities?after=${depois}&per_page=100&page=${pagina}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`Strava atividades ${r.status}`);
    const lista: AtividadeStrava[] = await r.json();
    for (const a of lista) {
      const l = paraLinha(a, userId);
      if (l) linhas.push(l);
      const x = paraExtra(a, userId);
      if (x) extras.push(x);
    }
    if (lista.length < 100) break;
  }
  if (linhas.length) await admin.from("atividades").upsert(linhas);
  if (extras.length) {
    const { error } = await admin.from("treinos_extras").upsert(extras, { onConflict: "strava_id" });
    if (error) throw new Error(`treinos extras: ${error.message}`);
  }
  return linhas.length;
}

/** Busca uma atividade (usado pelo webhook). */
export async function importarAtividade(admin: SupabaseClient, userId: string, atividadeId: number) {
  const token = await tokenDoAluno(admin, userId);
  if (!token) return;
  const r = await fetch(`${API}/activities/${atividadeId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) {
    await admin.from("atividades").delete().eq("id", atividadeId);
    await admin.from("treinos_extras").delete().eq("strava_id", atividadeId);
    return;
  }
  if (!r.ok) throw new Error(`Strava atividade ${r.status}`);
  const a: AtividadeStrava = await r.json();
  const l = paraLinha(a, userId);
  if (l) await admin.from("atividades").upsert(l);
  else await admin.from("atividades").delete().eq("id", atividadeId);
  const x = paraExtra(a, userId);
  if (x) await admin.from("treinos_extras").upsert(x, { onConflict: "strava_id" });
  else await admin.from("treinos_extras").delete().eq("strava_id", atividadeId);
}
