import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Quantas peças de cada item estão disponíveis (estoque − reservadas em pedidos pendentes/pagos).
 * Devolve null se o estoque ainda não foi cadastrado (aí não bloqueamos pedidos).
 */
export async function disponibilidade(admin: SupabaseClient): Promise<Record<string, number> | null> {
  const [{ data: itens }, { data: abertos }] = await Promise.all([
    admin.from("estoque_itens").select("id, nome, quantidade"),
    admin.from("pedidos").select("pedido_itens(estoque_item_id)").in("status", ["pendente", "pago"]),
  ]);
  if (!itens || itens.length === 0) return null;
  const reservado = new Map<string, number>();
  for (const p of abertos ?? [])
    for (const it of (p.pedido_itens ?? []) as { estoque_item_id: string | null }[])
      if (it.estoque_item_id) reservado.set(it.estoque_item_id, (reservado.get(it.estoque_item_id) ?? 0) + 1);
  const disp: Record<string, number> = {};
  for (const i of itens) disp[i.nome as string] = Math.max(0, Number(i.quantidade) - (reservado.get(i.id as string) ?? 0));
  return disp;
}
