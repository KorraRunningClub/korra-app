import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { lerValor } from "@/lib/despesas";
import { CORES, ESTAMPAS, TAMANHOS, TIPOS_MOV, type TipoMov } from "@/lib/loja";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const ancora = String(form.get("ancora") ?? "estoque");
  const ir = (q: string) => NextResponse.redirect(new URL(`/treinador/loja${q}#${ancora}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return NextResponse.redirect(new URL("/entrar", request.url), { status: 303 });
  const db = sessao.supabase;
  const acao = String(form.get("acao") ?? "");

  try {
    if (acao === "semear") {
      const linhas: { produto: string; nome: string; ordem: number }[] = [];
      let ordem = 0;
      for (const cor of CORES) for (const est of ESTAMPAS) for (const tam of TAMANHOS)
        linhas.push({ produto: "camiseta", nome: `Camiseta ${cor} · ${est} · ${tam}`, ordem: ordem++ });
      linhas.push({ produto: "squeeze", nome: "Squeeze Korrá", ordem: ordem++ });
      const { error } = await db.from("estoque_itens").upsert(linhas, { onConflict: "nome", ignoreDuplicates: true });
      if (error) throw error;
      return ir("?ok=semeado");
    }

    if (acao === "item") {
      const produto = String(form.get("produto") ?? "");
      let nome = String(form.get("nome") ?? "").trim();
      if (produto === "camiseta") {
        const cor = String(form.get("cor") ?? ""), est = String(form.get("estampa") ?? ""), tam = String(form.get("tamanho") ?? "");
        nome = `Camiseta ${cor} · ${est} · ${tam}`;
      } else if (produto === "squeeze" && !nome) nome = "Squeeze Korrá";
      if (!["camiseta", "squeeze", "outro"].includes(produto) || nome.length < 3) return ir("?erro=item");
      const qtd = Math.max(0, parseInt(String(form.get("quantidade") ?? "0"), 10) || 0);
      const { error } = await db.from("estoque_itens").insert({ produto, nome, quantidade: qtd, ordem: 999 });
      if (error) return ir(error.code === "23505" ? "?erro=duplicado" : "?erro=item");
      return ir("?ok=item");
    }

    if (acao === "contagem") {
      // várias quantidades de uma vez: campos q_<id>
      const updates: { id: string; quantidade: number }[] = [];
      for (const [k, v] of form.entries()) {
        if (!k.startsWith("q_")) continue;
        const n = parseInt(String(v), 10);
        if (Number.isFinite(n) && n >= 0) updates.push({ id: k.slice(2), quantidade: n });
      }
      for (const u of updates) {
        await db.from("estoque_itens").update({ quantidade: u.quantidade, atualizado_em: new Date().toISOString() }).eq("id", u.id);
      }
      return ir("?ok=contagem");
    }

    if (acao === "apagar_item") {
      await db.from("estoque_itens").delete().eq("id", String(form.get("id") ?? ""));
      return ir("?ok=apagado");
    }

    if (acao === "movimento") {
      const tipo = String(form.get("tipo") ?? "") as TipoMov;
      if (!(tipo in TIPOS_MOV)) return ir("?erro=tipo");
      const bruto = String(form.get("valor") ?? "").trim();
      const negativo = bruto.startsWith("-");
      const v = lerValor(bruto.replace(/^-/, ""));
      if (v === null) return ir("?erro=valor");
      const sinal = tipo === "ajuste" ? (negativo ? -1 : 1) : TIPOS_MOV[tipo].sinal;
      const data = String(form.get("data") ?? "");
      const { error } = await db.from("loja_movimentos").insert({
        tipo,
        valor: sinal * v,
        data: /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : undefined,
        descricao: String(form.get("descricao") ?? "").trim().slice(0, 200) || null,
      });
      if (error) throw error;
      return ir("?ok=movimento");
    }

    if (acao === "apagar_mov") {
      await db.from("loja_movimentos").delete().eq("id", String(form.get("id") ?? ""));
      return ir("?ok=apagado");
    }
  } catch (e) {
    console.error("loja", e);
    const codigo = (e as { code?: string })?.code ?? "";
    // tabela ainda não criada no Supabase (falta rodar o SQL 0011)
    if (codigo === "42P01" || codigo === "PGRST205") return ir("?erro=tabela");
    return ir("?erro=salvar");
  }
  return ir("");
}
