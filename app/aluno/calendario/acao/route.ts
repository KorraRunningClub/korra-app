import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { TIPOS_EVENTO, somarDias } from "@/lib/calendario";

const txt = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const horaOk = (v: string) => (/^\d{2}:\d{2}$/.test(v) ? v : null);

// Criar, editar e apagar eventos do calendário (só o treinador).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const mes = txt(form.get("mes"), 7);
  const ir = (q: string) => NextResponse.redirect(new URL(`/aluno/calendario?mes=${mes}${q}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar?voltar=/aluno/calendario", request.url), { status: 303 });
  if (sessao.perfil?.papel !== "treinador") return ir("&erro=permissao");
  const db = sessao.supabase;
  const acao = txt(form.get("acao"), 20);
  const id = txt(form.get("id"), 40);

  try {
    if (acao === "apagar" || acao === "apagar_serie") {
      if (acao === "apagar_serie") {
        const { data: ev } = await db.from("eventos").select("grupo, data").eq("id", id).single();
        if (ev?.grupo) {
          const { error } = await db.from("eventos").delete().eq("grupo", ev.grupo).gte("data", ev.data);
          if (error) throw error;
          return ir("&ok=apagado");
        }
      }
      const { error } = await db.from("eventos").delete().eq("id", id);
      if (error) throw error;
      return ir("&ok=apagado");
    }

    const tipo = txt(form.get("tipo"), 20);
    const titulo = txt(form.get("titulo"), 120);
    const data = txt(form.get("data"), 10);
    if (!(tipo in TIPOS_EVENTO)) return ir("&erro=tipo");
    if (titulo.length < 2) return ir("&erro=titulo");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return ir("&erro=data");
    const base = {
      tipo, titulo, data,
      hora_inicio: horaOk(txt(form.get("hora_inicio"), 5)),
      hora_fim: horaOk(txt(form.get("hora_fim"), 5)),
      local_nome: txt(form.get("local_nome"), 120) || null,
      endereco: txt(form.get("endereco"), 250) || null,
      descricao: txt(form.get("descricao"), 2000) || null,
      prova_id: txt(form.get("prova_id"), 40) || null,
    };

    if (acao === "editar") {
      const { error } = await db.from("eventos").update(base).eq("id", id);
      if (error) throw error;
      return ir(`&evento=${id}&ok=salvo`);
    }

    // criar (com opção de repetir toda semana)
    const semanas = Math.min(26, Math.max(1, parseInt(txt(form.get("repetir"), 3), 10) || 1));
    const grupo = semanas > 1 ? crypto.randomUUID() : null;
    const linhas = Array.from({ length: semanas }, (_, i) => ({ ...base, data: somarDias(data, 7 * i), grupo, criado_por: sessao.user.id }));
    const { error } = await db.from("eventos").insert(linhas);
    if (error) throw error;
    return NextResponse.redirect(new URL(`/aluno/calendario?mes=${data.slice(0, 7)}&ok=${semanas > 1 ? "serie" : "criado"}`, request.url), { status: 303 });
  } catch (e) {
    console.error("calendario", e);
    const codigo = (e as { code?: string })?.code ?? "";
    if (codigo === "42P01" || codigo === "PGRST205") return ir("&erro=tabela");
    return ir("&erro=salvar");
  }
}
