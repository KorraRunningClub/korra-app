import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAdmin } from "@/lib/supabase/admin";
import { importarAtividade } from "@/lib/strava";
import { recalcularSemestreSeguro } from "@/lib/semestral";

// Verificação da assinatura do webhook (Strava chama uma vez ao criar).
export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.STRAVA_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": p.get("hub.challenge") });
  }
  return new NextResponse("forbidden", { status: 403 });
}

type Evento = {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  updates?: Record<string, string>;
};

async function processar(ev: Evento) {
  const admin = createAdmin();
  const { data: c } = await admin.from("strava_conexoes").select("user_id").eq("athlete_id", ev.owner_id).single();
  if (!c) return;
  if (ev.object_type === "athlete" && ev.updates?.authorized === "false") {
    await admin.from("strava_conexoes").delete().eq("user_id", c.user_id);
    await admin.from("atividades").delete().eq("user_id", c.user_id).eq("fonte", "strava");
    await admin.from("sequencias_semestre").delete().eq("user_id", c.user_id);
    return;
  }
  if (ev.object_type !== "activity") return;
  if (ev.aspect_type === "delete") {
    await admin.from("atividades").delete().eq("id", ev.object_id);
  } else {
    await importarAtividade(admin, c.user_id, ev.object_id);
  }
  // corrida nova/editada/apagada: refaz a conta do semestre direto do Strava
  await recalcularSemestreSeguro(admin, c.user_id);
}

// Strava avisa aqui quando alguém cria, edita ou apaga uma atividade.
export async function POST(request: NextRequest) {
  const ev = (await request.json().catch(() => null)) as Evento | null;
  if (ev) {
    const tarefa = processar(ev).catch((e) => console.error("strava webhook", e));
    try {
      getCloudflareContext().ctx.waitUntil(tarefa);
    } catch {
      await tarefa;
    }
  }
  return NextResponse.json({ ok: true });
}
