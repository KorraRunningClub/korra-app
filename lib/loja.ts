// Catálogo da loja (preços exibidos no site)
export type ItemLoja = { id: string; nome: string; detalhe: string; preco: number; separado?: number; destaque?: boolean };

export const CATALOGO: ItemLoja[] = [
  { id: "camiseta", nome: "Camiseta oficial", detalhe: "Preta ou branca · estampa no peito ou logo nas costas", preco: 99.99 },
  { id: "squeeze", nome: "Squeeze Korrá", detalhe: "Garrafa flexível pra levar no treino e na prova", preco: 59.99 },
  { id: "kit-cs", nome: "Kit 1 camiseta + 1 squeeze", detalhe: "O kit pra começar", preco: 139.99, separado: 159.98 },
  { id: "kit-2c", nome: "Kit 2 camisetas", detalhe: "Uma pra treinar, outra pra prova", preco: 179.99, separado: 199.98 },
  { id: "kit-2cs", nome: "Kit 2 camisetas + 1 squeeze", detalhe: "O kit completo", preco: 219.99, separado: 259.97, destaque: true },
];

export const CORES = ["Preta", "Branca"] as const;
export const ESTAMPAS = ["Peito", "Costas"] as const;
export const TAMANHOS = ["PP", "P", "M", "G", "GG", "XGG"] as const;

export const TIPOS_MOV = {
  saldo_inicial: { nome: "Saldo inicial", sinal: 1 },
  venda: { nome: "Venda", sinal: 1 },
  compra: { nome: "Compra de estoque", sinal: -1 },
  retirada: { nome: "Retirada", sinal: -1 },
  ajuste: { nome: "Ajuste", sinal: 1 },
} as const;
export type TipoMov = keyof typeof TIPOS_MOV;

export const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function linkPedido(nome: string) {
  const texto = `Olá! Quero o ${nome} da Korrá. Cor: Estampa: Tamanho:`;
  return `https://wa.me/5548985001468?text=${encodeURIComponent(texto)}`;
}
