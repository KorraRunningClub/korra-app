import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { CATEGORIAS_FORUM, idYoutube, type CategoriaForum } from "@/lib/forum";

export async function POST(request: NextRequest) {
  const ir = (q: string) => NextResponse.redirect(new URL(`/treinador/conteudos${q}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const form = await request.formData();

  if (form.get("acao") === "apagar") {
    await sessao.supabase.from("conteudos").delete().eq("id", String(form.get("id") ?? ""));
    return ir("?ok=apagado");
  }

  const categoria = String(form.get("categoria") ?? "") as CategoriaForum;
  const titulo = String(form.get("titulo") ?? "").trim();
  const yt = idYoutube(String(form.get("link") ?? ""));
  if (!(categoria in CATEGORIAS_FORUM)) return ir("?erro=categoria");
  if (titulo.length < 3) return ir("?erro=titulo");
  if (!yt) return ir("?erro=link");

  const insta = String(form.get("parceiro_instagram") ?? "").trim().replace(/^@/, "").replace(/[^\w.]/g, "");
  const { error } = await sessao.supabase.from("conteudos").insert({
    aba: CATEGORIAS_FORUM[categoria].aba,
    categoria,
    titulo,
    youtube_id: yt,
    descricao: String(form.get("descricao") ?? "").trim() || null,
    parceiro_nome: String(form.get("parceiro_nome") ?? "").trim() || null,
    parceiro_instagram: insta || null,
  });
  if (error) {
    console.error("publicar conteudo", error);
    return ir("?erro=erro");
  }
  return ir("?ok=1");
}
