import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { TabelaZonas } from "@/components/TabelaZonas";
import { TESTES, mmss, type Teste } from "@/lib/zonas";

export const metadata = { title: "Minhas zonas de treino · Korrá Running Club" };

export default async function MinhasZonas() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/zonas");
  const { supabase, user, perfil } = sessao;
  const treinador = perfil?.papel === "treinador";
  const { data } = await supabase.from("testes_zonas").select("id, teste, data, tempo_s, obs").eq("user_id", user.id)
    .order("data", { ascending: false }).order("criado_em", { ascending: false });
  const testes = (data ?? []) as { id: string; teste: Teste; data: string; tempo_s: number; obs: string | null }[];
  const atual = testes[0];
  const dbr = (d: string) => d.split("-").reverse().join("/");

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={treinador} />
      <main className="app-shell">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="eyebrow">Minha área</div>
          <h1 style={{ marginTop: 14 }}>Minhas zonas de treino</h1>
          {!atual ? (
            <p className="msg" style={{ marginTop: 20 }}>Suas zonas aparecem aqui depois do seu primeiro teste (1600 m, 3000 m ou 5 km). Fale com o treinador.</p>
          ) : (
            <>
              <p style={{ marginTop: 12 }}>
                Calculadas a partir do seu <b>{TESTES[atual.teste].nome}</b> em {dbr(atual.data)}. Use o pace de cada zona nos treinos que o treinador passar.
              </p>
              <div className="zonas-destaque"><TabelaZonas teste={atual.teste} tempoS={atual.tempo_s} /></div>
              <p className="regra" style={{ marginTop: 10 }}>Pace mais lento à esquerda, mais rápido à direita. As zonas são atualizadas a cada novo teste.</p>
              {testes.length > 1 && (
                <>
                  <h2 className="sub-provas" style={{ marginTop: 36 }}>Meus testes</h2>
                  <ul className="provas-lista">
                    {testes.map((t) => (
                      <li key={t.id}>
                        <div><b>{TESTES[t.teste].nome}</b><span className="prova-info">{dbr(t.data)}{t.obs ? ` · ${t.obs}` : ""}</span></div>
                        <span className="contagem"><b>{mmss(t.tempo_s)}</b></span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
