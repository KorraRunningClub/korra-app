import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export const metadata = { title: "Minha área · Korrá Running Club" };

const STATUS: Record<string, { rotulo: string; texto: string }> = {
  ativo: { rotulo: "Ativo", texto: "Sua matrícula está em dia. Bons treinos!" },
  pendente: {
    rotulo: "Aguardando ativação",
    texto: "Recebemos seu cadastro. Assim que o pagamento for confirmado, seu acesso é liberado.",
  },
  bloqueado: {
    rotulo: "Acesso pausado",
    texto: "Identificamos uma mensalidade em aberto. Regularize pelo WhatsApp (48) 98500-1468 para voltar.",
  },
};

export default async function AlunoPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  const { user, perfil } = sessao;
  const status = STATUS[perfil?.status ?? "pendente"];
  const primeiroNome = perfil?.nome?.split(" ")[0];

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={perfil?.papel === "treinador"} />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Minha área</div>
          <h1 style={{ marginTop: "14px" }}>{primeiroNome ? `Bora, ${primeiroNome}!` : "Bem-vindo à Korrá!"}</h1>
          <p style={{ marginTop: "16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span className={`pill ${perfil?.status ?? "pendente"}`}>{status.rotulo}</span>
            {status.texto}
          </p>

          <div className="grid-cards">
            <div className="tile">
              <span className="k">Plano</span>
              <span className="v">Mensal</span>
              <span>R$ 165/mês · presencial + online</span>
            </div>
            <div className="tile">
              <span className="k">Treinos presenciais</span>
              <span>Terças e quintas, 19h30 · Pedra Branca (R. das Baronesas, 663)</span>
              <span>2 terças por mês no Parque de Coqueiros</span>
            </div>
            <div className="tile">
              <span className="k">Em breve</span>
              <span>Pagamento pelo app, rankings da semana, Diz Aí Como Foi e conteúdos.</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
