import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSessao } from "@/lib/supabase/server";
import { CATALOGO } from "@/lib/loja";
import { FormPedido } from "./FormPedido";

export const metadata = { title: "Fazer pedido · Loja Korrá" };

const ERRO: Record<string, string> = {
  nome: "Coloque seu nome para a gente saber de quem é o pedido.",
  pecas: "Escolha estilo, cor e tamanho de todas as camisetas.",
  salvar: "Não conseguimos registrar o pedido agora. Tente de novo ou chame no WhatsApp (48) 98500-1468.",
};

export default async function PedirPage({ searchParams }: { searchParams: Promise<{ item?: string; erro?: string }> }) {
  const { item: id, erro } = await searchParams;
  const item = CATALOGO.find((c) => c.id === id) ?? CATALOGO[0];
  const sessao = await getSessao().catch(() => null);
  let telefone = "";
  if (sessao) {
    const { data } = await sessao.supabase.from("perfis").select("telefone").eq("id", sessao.user.id).single<{ telefone: string | null }>();
    telefone = data?.telefone ?? "";
  }

  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <div className="wrap pedido-wrap">
          <Link className="voltar-loja" href="/#loja">← Voltar para a loja</Link>
          <div className="eyebrow" style={{ marginTop: 18 }}>Loja Korrá</div>
          <h1 style={{ marginTop: 10 }}>Fazer pedido</h1>
          <p className="regra" style={{ marginTop: 10 }}>
            Escolha as peças e clique em enviar: o pedido fica registrado e abre o WhatsApp com a mensagem pronta. É só mandar.
          </p>
          {erro && <p className="msg erro" style={{ marginTop: 16 }}>{ERRO[erro] ?? "Algo deu errado."}</p>}
          <FormPedido itemInicial={item.id} nome={sessao?.perfil?.nome ?? ""} telefone={telefone} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
