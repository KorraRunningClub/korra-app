import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { somarDias } from "@/lib/calendario";
import { TIPOS_AGENDA } from "@/lib/agenda";

const txt = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const semana = txt(form.get("semana"), 10);
  const ir = (q: string, s = semana) => NextResponse.redirect(new URL(`/treinador/agenda?semana=${s}${q}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const db = sessao.supabase;
  const acao = txt(form.get("acao"), 20);
  const id = txt(form.get("id"), 40);
  try {
    if (acao === "apagar" || acao === "apagar_serie") {
      if (acao === "apagar_serie") {
        const { data: it } = await db.from("agenda_itens").select("grupo, data").eq("id", id).single();
        if (it?.grupo) {
          const { error } = await db.from("agenda_itens").delete().eq("grupo", it.grupo).gte("data", it.data);
          if (error) throw error;
          return ir("&ok=apagado");
        }
      }
      const { error } = await db.from("agenda_itens").delete().eq("id", id);
      if (error) throw error;
      return ir("&ok=apagado");
    }
    const tipo = txt(form.get("tipo"), 20);
    const personalId = txt(form.get("personal_id"), 40) || null;
    let titulo = txt(form.get("titulo"), 120);
    if (!titulo && personalId) {
      const { data: al } = await db.from("personal_alunos").select("nome").eq("id", personalId).single();
      if (al) titulo = `Personal · ${al.nome}`;
    }
    const data = txt(form.get("data"), 10);
    const hi = txt(form.get("hora_inicio"), 5), hf = txt(form.get("hora_fim"), 5);
    if (!(tipo in TIPOS_AGENDA) || !titulo || !/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hi) || !/^\d{2}:\d{2}$/.test(hf) || hf <= hi) return ir("&erro=dados");
    const base = { tipo, titulo, data, hora_inicio: hi, hora_fim: hf, local: txt(form.get("local"), 120) || null, obs: txt(form.get("obs"), 1000) || null, personal_id: personalId };
    if (acao === "editar") {
      const { error } = await db.from("agenda_itens").update(base).eq("id", id);
      if (error) throw error;
      return ir(`&item=${id}&ok=salvo`);
    }
    const n = Math.min(52, Math.max(1, parseInt(txt(form.get("repetir"), 3), 10) || 1));
    const grupo = n > 1 ? crypto.randomUUID() : null;
    const { error } = await db.from("agenda_itens").insert(
      Array.from({ length: n }, (_, i) => ({ ...base, data: somarDias(data, 7 * i), grupo, dono: sessao.user.id })),
    );
    if (error) throw error;
    return ir(`&ok=${n > 1 ? "serie" : "criado"}`, data);
  } catch (e) {
    console.error("agenda", e);
    const codigo = (e as { code?: string })?.code ?? "";
    return ir(codigo === "42P01" || codigo === "PGRST205" ? "&erro=tabela" : "&erro=salvar");
  }
}
