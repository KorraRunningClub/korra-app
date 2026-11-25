import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { TESTES, lerTempoZona, type Teste } from "@/lib/zonas";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const ir = (q: string, ancora = "") => NextResponse.redirect(new URL(`/treinador/zonas${q}${ancora}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const db = sessao.supabase;
  const userId = String(form.get("user_id") ?? "");
  try {
    if (form.get("acao") === "apagar") {
      const { error } = await db.from("testes_zonas").delete().eq("id", String(form.get("id") ?? ""));
      if (error) throw error;
      return ir("?ok=apagado", `#a-${userId}`);
    }
    const teste = String(form.get("teste") ?? "") as Teste;
    const data = String(form.get("data") ?? "");
    const valor = lerTempoZona(String(form.get("valor") ?? ""));
    if (!(teste in TESTES) || !userId || !/^\d{4}-\d{2}-\d{2}$/.test(data) || !valor) return ir("?erro=dados", `#a-${userId}`);
    const tempo_s = form.get("modo") === "pace" ? Math.round(valor * (TESTES[teste].metros / 1000)) : valor;
    const { error } = await db.from("testes_zonas").insert({ user_id: userId, teste, data, tempo_s, obs: String(form.get("obs") ?? "").trim().slice(0, 300) || null });
    if (error) throw error;
    return ir("?ok=salvo", `#a-${userId}`);
  } catch (e) {
    console.error("zonas", e);
    const codigo = (e as { code?: string })?.code ?? "";
    return ir(codigo === "42P01" || codigo === "PGRST205" ? "?erro=tabela" : "?erro=salvar");
  }
}
