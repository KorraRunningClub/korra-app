import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { FASES_TREINO, NIVEIS, SUBTIPOS, TIPOS, UNIDADES, type Bloco, type Estrutura } from "@/lib/biblioteca";

const txt = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const numero = (v: string) => { const x = Number(v.replace(",", ".")); return Number.isFinite(x) && x > 0 ? x : null; };
/** "1:20" → 80; "90" → 90 s; "2 min" → 120 */
function segundos(v: string): number | null {
  const s = v.trim().toLowerCase();
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const x = numero(s.replace(/[^\d,.]/g, ""));
  if (x === null) return null;
  return /min/.test(s) ? Math.round(x * 60) : Math.round(x);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const fase = txt(form.get("fase"), 20);
  const atleta = txt(form.get("atleta"), 40);
  const ir = (q: string) => NextResponse.redirect(new URL(`/treinador/treinos?fase=${fase in FASES_TREINO ? fase : "base"}${atleta ? `&atleta=${atleta}` : ""}${q}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const db = sessao.supabase.from("treinos_modelo");
  const id = txt(form.get("id"), 40);
  try {
    if (form.get("acao") === "apagar") {
      const { error } = await db.delete().eq("id", id);
      if (error) throw error;
      return ir("&ok=apagado");
    }
    const tipo = txt(form.get("tipo"), 20);
    const nivel = txt(form.get("nivel"), 20);
    if (!(tipo in TIPOS) || !(fase in FASES_TREINO) || !(nivel in NIVEIS)) return ir("&erro=dados");
    const bloco = (p: string, obrigatorio = true): Bloco | null | "erro" => {
      const valor = numero(txt(form.get(`${p}_valor`), 10));
      const unidade = txt(form.get(`${p}_unidade`), 4);
      const zona = parseInt(txt(form.get(`${p}_zona`), 2), 10);
      if (valor === null) return obrigatorio ? "erro" : null;
      if (!(unidade in UNIDADES) || !(zona >= 1 && zona <= 6)) return "erro";
      return { valor, unidade: unidade as Bloco["unidade"], zona };
    };
    let estrutura: Estrutura;
    let subtipo: string | null = null;
    if (tipo === "intervalado") {
      subtipo = txt(form.get("subtipo"), 30);
      if (!(subtipo in SUBTIPOS)) return ir("&erro=dados");
      const aq = bloco("aquecimento"), st = bloco("strides", false), vc = bloco("volta_calma");
      const series = parseInt(txt(form.get("series"), 3), 10);
      const seriesMaxT = txt(form.get("series_max"), 3);
      const seriesMax = seriesMaxT ? parseInt(seriesMaxT, 10) : null;
      const sv = numero(txt(form.get("serie_valor"), 10));
      const su = txt(form.get("serie_unidade"), 4);
      const sz = parseInt(txt(form.get("serie_zona"), 2), 10);
      if (aq === "erro" || st === "erro" || vc === "erro" || !aq || !vc || !(series >= 1) || (seriesMax !== null && !(seriesMax >= series)) ||
        sv === null || !(su in UNIDADES) || !(sz >= 1 && sz <= 6)) return ir("&erro=dados");
      const [d1, d2] = txt(form.get("descanso"), 30).split(/\s*(?:a|-|até)\s*/);
      estrutura = {
        aquecimento: aq, strides: st,
        descanso_strides_s: segundos(txt(form.get("descanso_strides"), 20)),
        serie: { series, series_max: seriesMax, valor: sv, unidade: su as Bloco["unidade"], zona: sz },
        descanso_s: segundos(d1 ?? ""), descanso_max_s: d2 ? segundos(d2) : null,
        volta_calma: vc,
      };
    } else {
      const p = bloco("principal");
      if (p === "erro" || !p) return ir("&erro=dados");
      estrutura = { principal: p };
    }
    const nome = txt(form.get("nome"), 80) || (subtipo ? SUBTIPOS[subtipo as keyof typeof SUBTIPOS] : TIPOS[tipo as keyof typeof TIPOS]);
    const linha = { fase, nivel, nome, tipo, subtipo, estrutura, obs: txt(form.get("obs"), 500) || null };
    const { error } = form.get("acao") === "editar" ? await db.update(linha).eq("id", id) : await db.insert(linha);
    if (error) throw error;
    return ir("&ok=salvo");
  } catch (e) {
    console.error("biblioteca", e);
    const codigo = (e as { code?: string })?.code ?? "";
    return ir(codigo === "42P01" || codigo === "PGRST205" || codigo === "PGRST204" ? "&erro=tabela" : "&erro=salvar");
  }
}
