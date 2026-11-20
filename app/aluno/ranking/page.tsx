import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { dataBR, mes, pace, semana } from "@/lib/semana";

export const metadata = { title: "Ranking · Korrá Running Club" };

type Linha = { user_id: string; nome: string | null; valor: number; distancia_m: number; tempo_mov_s: number };

const MSG: Record<string, string> = {
  negado: "Você não autorizou o Strava. Tente de novo e clique em “Autorizar”.",
  escopo: "Precisamos da permissão para ler suas atividades. Conecte de novo e deixe a opção de atividades marcada.",
  state: "A conexão expirou. Clique em conectar de novo.",
  conexao: "Não conseguimos conectar com o Strava agora. Tente de novo em instantes.",
  sincronizar: "Não conseguimos buscar seus treinos agora. Tente de novo em instantes.",
  config: "A conexão com o Strava ainda está sendo configurada. Volte em breve.",
};

function nomeCurto(n: string | null) {
  if (!n) return "Atleta";
  const p = n.trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
}

function Quadro({ titulo, regra, linhas, formato, eu }: {
  titulo: string; regra: string; linhas: Linha[]; formato: (l: Linha) => string; eu: string;
}) {
  return (
    <section className="quadro">
      <h3>{titulo}</h3>
      <p className="regra">{regra}</p>
      {linhas.length === 0 ? (
        <p className="vazio">Ninguém pontuou ainda. Bora inaugurar?</p>
      ) : (
        <ol>
          {linhas.slice(0, 10).map((l, i) => (
            <li key={l.user_id} className={l.user_id === eu ? "eu" : undefined}>
              <span className={`pos pos-${i + 1}`}>{i + 1}</span>
              <span className="quem">{nomeCurto(l.nome)}{l.user_id === eu ? " (você)" : ""}</span>
              <span className="valor">{formato(l)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/ranking");
  const { supabase, user, perfil } = sessao;
  const q = await searchParams;
  const treinador = perfil?.papel === "treinador";
  const liberado = perfil?.status === "ativo" || treinador;

  const passada = q.semana === "passada";
  const s = semana(passada ? -1 : 0);
  const m = mes(0);

  const [{ data: conectado }, { data: pref }, km, longa, rapida, kmMes, { data: minhas }] = await Promise.all([
    supabase.rpc("strava_conectado"),
    supabase.from("perfis").select("aparecer_ranking").eq("id", user.id).single<{ aparecer_ranking: boolean }>(),
    supabase.rpc("ranking", { p_tipo: "km", p_inicio: s.inicio, p_fim: s.fim }),
    supabase.rpc("ranking", { p_tipo: "longa", p_inicio: s.inicio, p_fim: s.fim }),
    supabase.rpc("ranking", { p_tipo: "rapida", p_inicio: s.inicio, p_fim: s.fim }),
    supabase.rpc("ranking", { p_tipo: "km", p_inicio: m.inicio, p_fim: m.fim }),
    supabase.from("atividades").select("id, inicio_local, nome, distancia_m, tempo_mov_s, tempo_total_s, esteira")
      .eq("user_id", user.id).order("inicio_local", { ascending: false }).limit(8),
  ]);

  const ord = (r: { data: Linha[] | null }, asc = false) =>
    [...(r.data ?? [])].sort((a, b) => (asc ? Number(a.valor) - Number(b.valor) : Number(b.valor) - Number(a.valor)));
  const km1 = (l: Linha) => `${Number(l.valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={treinador} />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Desafios Korrá</div>
          <h1 style={{ marginTop: "14px" }}>Ranking</h1>

          {q.erro && <p className="msg erro" style={{ marginTop: 18 }}>{MSG[q.erro] ?? "Algo deu errado."}</p>}
          {q.conectado && <p className="msg" style={{ marginTop: 18 }}>Strava conectado! Importamos {q.conectado} corridas dos últimos 35 dias.</p>}
          {q.sincronizado && <p className="msg" style={{ marginTop: 18 }}>Pronto! {q.sincronizado} corridas atualizadas.</p>}
          {q.desconectado && <p className="msg" style={{ marginTop: 18 }}>Strava desconectado e seus treinos removidos do ranking.</p>}
          {q.pref && <p className="msg" style={{ marginTop: 18 }}>Preferência salva.</p>}

          {!liberado ? (
            <p className="msg" style={{ marginTop: 24 }}>O ranking libera assim que sua matrícula estiver ativa.</p>
          ) : (
            <>
              <div className="strava-box">
                {conectado ? (
                  <>
                    <p><b>Strava conectado.</b> Suas corridas novas entram sozinhas no ranking em alguns minutos.</p>
                    <div className="strava-acoes">
                      <form action="/strava/sincronizar" method="post"><button className="btn btn-ghost" type="submit">Atualizar agora</button></form>
                      <form action="/strava/desconectar" method="post"><button className="btn-link" type="submit">Desconectar</button></form>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Conecte seu Strava para seus treinos entrarem no ranking automaticamente.</p>
                    <a className="btn btn-strava" href="/strava/conectar">Conectar com o Strava</a>
                  </>
                )}
              </div>

              <div className="semana-nav">
                <b>Semana de {dataBR(s.segunda)} a {dataBR(s.domingo)}</b>
                {passada ? <Link href="/aluno/ranking">Ver semana atual →</Link> : <Link href="/aluno/ranking?semana=passada">← Semana passada</Link>}
              </div>

              <div className="quadros">
                <Quadro titulo="Corrida mais longa" regra="A maior corrida contínua da semana (até 2 min de pausa)." linhas={ord(longa)} formato={km1} eu={user.id} />
                <Quadro titulo="Corrida mais rápida" regra="Melhor pace médio em corridas de 5 km ou mais." linhas={ord(rapida, true)} formato={(l) => pace(Number(l.valor))} eu={user.id} />
                <Quadro titulo="Maior quilometragem" regra="Soma de todas as corridas da semana." linhas={ord(km)} formato={km1} eu={user.id} />
                <Quadro titulo={`Quilometragem de ${m.nome}`} regra="Soma de todas as corridas do mês." linhas={ord(kmMes)} formato={km1} eu={user.id} />
              </div>
              <p className="regra" style={{ marginTop: 14 }}>Valem corridas de rua, trilha e esteira. Caminhadas não contam. Os 3 primeiros de cada quadro levam medalha.</p>

              <h2 style={{ marginTop: 48, fontSize: "clamp(24px,3vw,32px)" }}>Minhas últimas corridas</h2>
              <div style={{ overflowX: "auto", marginTop: 14 }}>
                <table className="tabela">
                  <thead><tr><th>Data</th><th>Treino</th><th>Distância</th><th>Pace</th><th>Pausas</th></tr></thead>
                  <tbody>
                    {(minhas ?? []).length === 0 && <tr><td colSpan={5}>Nenhuma corrida importada ainda.</td></tr>}
                    {(minhas ?? []).map((a) => (
                      <tr key={a.id}>
                        <td>{dataBR(a.inicio_local)}</td>
                        <td>{a.nome ?? "Corrida"}{a.esteira ? " · esteira" : ""}</td>
                        <td>{(Number(a.distancia_m) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km</td>
                        <td>{pace(a.tempo_mov_s / (Number(a.distancia_m) / 1000))}</td>
                        <td>{Math.round((a.tempo_total_s - a.tempo_mov_s) / 60)} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form action="/aluno/preferencias" method="post" className="pref-ranking">
                <span>{pref?.aparecer_ranking === false ? "Você está escondido do ranking." : "Você aparece no ranking para os outros alunos."}</span>
                <input type="hidden" name="aparecer_ranking" value={pref?.aparecer_ranking === false ? "sim" : "nao"} />
                <button className="btn-link" type="submit">{pref?.aparecer_ranking === false ? "Voltar a aparecer" : "Não quero aparecer"}</button>
              </form>
              <p className="powered">Dados de atividades fornecidos pelo Strava.</p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
