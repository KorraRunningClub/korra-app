import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { TabelaZonas } from "@/components/TabelaZonas";
import { TESTES, type Teste } from "@/lib/zonas";

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

export default async function AlunoPage({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  const { supabase, user, perfil } = sessao;
  const { salvo } = await searchParams;

  const { data: extra } = await supabase
    .from("perfis")
    .select("cadastro_completo, valor_mensal")
    .eq("id", user.id)
    .single<{ cadastro_completo: boolean; valor_mensal: number | null }>();
  const valor = extra?.valor_mensal === null || extra?.valor_mensal === undefined ? 165 : Number(extra.valor_mensal);
  if (perfil?.papel !== "treinador" && !extra?.cadastro_completo) redirect("/aluno/cadastro");
  const status = STATUS[perfil?.status ?? "pendente"];
  const { data: ultTeste } = await supabase.from("testes_zonas").select("teste, data, tempo_s").eq("user_id", user.id)
    .order("data", { ascending: false }).order("criado_em", { ascending: false }).limit(1).maybeSingle<{ teste: Teste; data: string; tempo_s: number }>();
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

          {salvo && <p className="msg" style={{ marginTop: "18px" }}>Cadastro salvo. Obrigado!</p>}

          <div className="grid-cards">
            <div className="tile">
              <span className="k">Plano</span>
              <span className="v">Mensal</span>
              <span>{valor === 0 ? "Gratuito" : `${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês`} · presencial + online</span>
            </div>
            <div className="tile">
              <span className="k">Treinos presenciais</span>
              <span>Terças e quintas, 19h30 · Pedra Branca (R. das Baronesas, 663)</span>
              <span>2 terças por mês no Parque de Coqueiros</span>
            </div>
            <div className="tile">
              <span className="k">Meus dados</span>
              <span>Nome, WhatsApp, objetivo e autorizações.</span>
              <a className="link-mapa" href="/aluno/cadastro">Editar cadastro →</a>
            </div>
            <div className="tile">
              <span className="k">Desafios</span>
              <span>Corrida mais longa, mais rápida e maior quilometragem da semana.</span>
              <a className="link-mapa" href="/aluno/ranking">Ver ranking →</a>
            </div>
            <div className="tile">
              <span className="k">Fórum</span>
              <span>Técnica, força e pliometria e as dicas dos nossos parceiros.</span>
              <a className="link-mapa" href="/aluno/forum">Ver conteúdos →</a>
            </div>
            <div className="tile">
              <span className="k">Diz Aí Como Foi</span>
              <span>Posta a foto ou o vídeo do treino. Some em 24 horas.</span>
              <a className="link-mapa" href="/aluno/diz-ai">Ver a comunidade →</a>
            </div>
            <div className="tile">
              <span className="k">Em breve</span>
              <span>Pagamento pelo app.</span>
            </div>
          </div>

          <section id="zonas" style={{ marginTop: 48 }}>
            <h2 className="sub-provas">Minhas zonas de treino</h2>
            {ultTeste ? (
              <>
                <p className="regra" style={{ marginTop: 6 }}>Pelo seu {TESTES[ultTeste.teste].nome} em {ultTeste.data.split("-").reverse().join("/")}. Pace mais lento à esquerda, mais rápido à direita.</p>
                <div className="zonas-destaque"><TabelaZonas teste={ultTeste.teste} tempoS={ultTeste.tempo_s} /></div>
              </>
            ) : (
              <p className="regra" style={{ marginTop: 6 }}>Suas zonas aparecem aqui depois do seu primeiro teste (1600 m, 3000 m ou 5 km).</p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
