// Catálogo da loja (preços exibidos no site)
export type ItemLoja = { id: string; nome: string; detalhe: string; preco: number; separado?: number; destaque?: boolean };

export const CATALOGO: ItemLoja[] = [
  { id: "camiseta", nome: "Camiseta oficial", detalhe: "Preta ou branca · tradicional unissex ou baby look · P ao GG", preco: 99.99 },
  { id: "squeeze", nome: "Squeeze Korrá", detalhe: "Garrafa flexível pra levar no treino e na prova", preco: 59.99 },
  { id: "kit-cs", nome: "Kit 1 camiseta + 1 squeeze", detalhe: "O kit pra começar", preco: 139.99, separado: 159.98 },
  { id: "kit-2c", nome: "Kit 2 camisetas", detalhe: "Uma pra treinar, outra pra prova", preco: 179.99, separado: 199.98 },
  { id: "kit-2cs", nome: "Kit 2 camisetas + 1 squeeze", detalhe: "O kit completo", preco: 219.99, separado: 259.97, destaque: true },
];

export const CORES = ["Preta", "Branca"] as const;
export const TAMANHOS = ["P", "M", "G", "GG"] as const;
/** Estilo da camiseta: valor curto (usado no estoque) e nome mostrado ao cliente. */
export const ESTILOS = ["Tradicional", "Baby look"] as const;
export const NOME_ESTILO: Record<string, string> = { Tradicional: "Tradicional unissex", "Baby look": "Baby look" };
export const nomeCamiseta = (cor: string, estilo: string, tamanho: string) => `Camiseta ${cor} · ${estilo} · ${tamanho}`;

export const TIPOS_MOV = {
  saldo_inicial: { nome: "Saldo inicial", sinal: 1 },
  venda: { nome: "Venda", sinal: 1 },
  compra: { nome: "Compra de estoque", sinal: -1 },
  retirada: { nome: "Retirada", sinal: -1 },
  ajuste: { nome: "Ajuste", sinal: 1 },
} as const;
export type TipoMov = keyof typeof TIPOS_MOV;

export const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const WHATS_LOJA = "5548985001468";
export const PIX_CHAVE = "arthurcanonica@hotmail.com"; // chave Pix (e-mail) — Arthur Canônica

/** Peças que compõem cada item do catálogo (1 unidade). */
export const PECAS_DO_ITEM: Record<string, ("camiseta" | "squeeze")[]> = {
  camiseta: ["camiseta"],
  squeeze: ["squeeze"],
  "kit-cs": ["camiseta", "squeeze"],
  "kit-2c": ["camiseta", "camiseta"],
  "kit-2cs": ["camiseta", "camiseta", "squeeze"],
};

export type PecaEscolhida = { tipo: "camiseta" | "squeeze"; cor?: string; estilo?: string; tamanho?: string };

/** Nome da peça igual ao usado no estoque. */
export const nomeEstoque = (p: PecaEscolhida) =>
  p.tipo === "squeeze" ? "Squeeze Korrá" : nomeCamiseta(p.cor!, p.estilo!, p.tamanho!);

/** Página de pedido (formulário com tamanho, cor, quantidade...). */
export const linkPedido = (id: string) => `/loja/pedir?item=${encodeURIComponent(id)}`;

export function mensagemPedido(o: { codigo: string; item: ItemLoja; qtd: number; pecas: PecaEscolhida[]; nome: string; obs?: string | null }) {
  const linhas = [
    `Olá, Arthur! Quero fazer um pedido na loja da Korrá.`,
    ``,
    `*Pedido #${o.codigo}*`,
    `${o.qtd}x ${o.item.nome} (${reais(o.item.preco)} cada)`,
    ``,
    `Peças:`,
    ...o.pecas.map((p) => `• ${nomeEstoque(p)}`),
    ``,
    `*Total: ${reais(o.item.preco * o.qtd)}*`,
    `Nome: ${o.nome}`,
  ];
  if (o.obs) linhas.push(`Obs.: ${o.obs}`);
  linhas.push(``, `Pagamento via Pix (chave: ${PIX_CHAVE}). Vou enviar o comprovante aqui.`);
  return `https://wa.me/${WHATS_LOJA}?text=${encodeURIComponent(linhas.join("\n"))}`;
}
