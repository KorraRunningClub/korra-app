import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { lerValor } from "@/lib/despesas";

// Define a mensalidade de um aluno: valor, gratuito (0) ou padrão (vazio).
export async function POST(request: NextRequest) {
  const ir = (q: string) => NextResponse.redirect(new URL(`/treinador${q}#alunos`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return ir("?erro=permissao");
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const modo = String(form.get("modo") ?? "valor");

  let valor: number | null;
  if (modo === "gratuito") valor = 0;
  else if (modo === "padrao") valor = null;
  else {
    const bruto = String(form.get("valor") ?? "").trim();
    if (bruto === "" ) valor = null;
    else if (/^0+([.,]0*)?$/.test(bruto)) valor = 0;
    else {
      valor = lerValor(bruto);
      if (valor === null) return ir("?erro=valor_aluno");
    }
  }

  const { data, error } = await sessao.supabase.from("perfis").update({ valor_mensal: valor }).eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("valor mensal", error);
    return ir("?erro=salvar");
  }
  return ir("?ok=valor");
}
