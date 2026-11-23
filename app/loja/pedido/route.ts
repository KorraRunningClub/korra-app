import { NextResponse, type NextRequest } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { getSessao } from "@/lib/supabase/server";
import { CATALOGO, CORES, ESTAMPAS, PECAS_DO_ITEM, TAMANHOS, mensagemPedido, nomeEstoque, type PecaEscolhida } from "@/lib/loja";

const curto = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

function gerarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => letras[b % letras.length]).join("");
}

// Recebe o formulário de pedido, registra (reservando as peças) e abre o WhatsApp com a mensagem pronta.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const item = CATALOGO.find((c) => c.id === String(form.get("item")));
  const volta = (erro: string) =>
    NextResponse.redirect(new URL(`/loja/pedir?item=${item?.id ?? ""}&erro=${erro}`, request.url), { status: 303 });
  if (!item) return volta("salvar");

  const qtd = Math.min(5, Math.max(1, parseInt(String(form.get("qtd") ?? "1"), 10) || 1));
  const nome = curto(form.get("nome"), 80);
  const telefone = curto(form.get("telefone"), 20) || null;
  const obs = curto(form.get("obs"), 200) || null;
  if (nome.length < 2) return volta("nome");

  const esperadas = Array.from({ length: qtd }, () => PECAS_DO_ITEM[item.id] ?? []).flat();
  const pecas: PecaEscolhida[] = [];
  for (let i = 0; i < esperadas.length; i++) {
    if (esperadas[i] === "squeeze") {
      pecas.push({ tipo: "squeeze" });
      continue;
    }
    const cor = String(form.get(`p${i}_cor`) ?? "");
    const estampa = String(form.get(`p${i}_estampa`) ?? "");
    const tamanho = String(form.get(`p${i}_tamanho`) ?? "");
    if (!(CORES as readonly string[]).includes(cor) || !(ESTAMPAS as readonly string[]).includes(estampa) || !(TAMANHOS as readonly string[]).includes(tamanho))
      return volta("pecas");
    pecas.push({ tipo: "camiseta", cor, estampa, tamanho });
  }

  try {
    const admin = createAdmin();
    const sessao = await getSessao().catch(() => null);
    const nomes = [...new Set(pecas.map(nomeEstoque))];
    const { data: estoque } = await admin.from("estoque_itens").select("id, nome").in("nome", nomes);
    const idPorNome = new Map((estoque ?? []).map((e) => [e.nome as string, e.id as string]));

    let codigo = gerarCodigo();
    let pedidoId: string | null = null;
    for (let tentativa = 0; tentativa < 3 && !pedidoId; tentativa++) {
      const { data, error } = await admin.from("pedidos").insert({
        codigo,
        user_id: sessao?.user.id ?? null,
        nome,
        telefone,
        item_id: item.id,
        item_nome: item.nome,
        quantidade: qtd,
        valor: Math.round(item.preco * qtd * 100) / 100,
        observacao: obs,
      }).select("id").single();
      if (error?.code === "23505") { codigo = gerarCodigo(); continue; }
      if (error) throw error;
      pedidoId = data.id;
    }
    if (!pedidoId) throw new Error("código repetido");
    const { error } = await admin.from("pedido_itens").insert(
      pecas.map((p) => ({ pedido_id: pedidoId, estoque_item_id: idPorNome.get(nomeEstoque(p)) ?? null, descricao: nomeEstoque(p) })),
    );
    if (error) throw error;
    return NextResponse.redirect(mensagemPedido({ codigo, item, qtd, pecas, nome, obs }), { status: 303 });
  } catch (e) {
    console.error("pedido loja", e);
    return volta("salvar");
  }
}
