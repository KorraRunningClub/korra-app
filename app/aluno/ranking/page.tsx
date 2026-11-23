import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { dataBR, mes, pace, semana } from "@/lib/semana";
import { AbasRanking, type Board } from "./Abas";
import { IconeHorario } from "@/components/IconeHorario";
import { META_CORRIDAS, META_KM, semestre, sequencias } from "@/lib/semestral";

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
  const sem = semestre(0);
  const hoje = semana(0);

  const [{ data: conectado }, { data: pref }, km, longa, rapida, kmMes, { data: minhas }, semRank, { data: minhaSem }, { count: estaSemana }] = await Promise.all([
    supabase.rpc("strava_conectado"),
    supabase.from("perfis").select("aparecer_ranking").eq("id", user.id).single<{ aparecer_ranking: boolean }>(),
    supabase.rpc("ranking", { p_tipo: "km", p_inicio: s.inicio, p_fim: s.fim }),
    supabase.rpc("ranking", { p_tipo: "longa", p_inicio: s.inicio, p_fim: s.fim }),
    supabase.rpc("ranking", { p_tipo: "rapida", p_inicio: s.inicio, p_fim: s.fim }),
    supabase.rpc("ranking", { p_tipo: "km", p_inicio: m.inicio, p_fim: m.fim }),
    supabase.from("atividades").select("id, inicio_local, nome, distancia_m, tempo_mov_s, tempo_total_s, esteira")
      .eq("user_id", user.id).order("inicio_local", { ascending: false }).limit(8),
    supabase.rpc("ranking_semestral", { p_semestre: sem.chave }),
    supabase.from("sequencias_semestre").select("semanas_ok, km_total").eq("user_id", user.id).eq("semestre", sem.chave)
      .maybeSingle<{ semanas_ok: string[]; km_total: number }>(),
    supabase.from("atividades").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .gte("inicio_local", hoje.inicio).lt("inicio_local", hoje.fim).gte("distancia_m", META_KM * 1000),
  ]);

  type LinhaSem = { user_id: string; nome: string | null; semanas_ok: string[]; km_total: number };
  const semLinhas = ((semRank.data ?? []) as LinhaSem[])
    .map((l) => ({ ...l, total: new Set(l.semanas_ok ?? []).size }))
    .filter((l) => l.total > 0)
    .sort((a, b) => b.total - a.total || Number(b.km_total) - Number(a.km_total));
  const minhaSeq = sequencias(minhaSem?.semanas_ok ?? []);
  const semanas = (n: number) => `${n} semana${n === 1 ? "" : "s"}`;

  const ord = (r: { data: Linha[] | null }, asc = false) =>
    [...(r.data ?? [])].sort((a, b) => (asc ? Number(a.valor) - Number(b.valor) : Number(b.valor) - Number(a.valor)));
  const km1 = (l: Linha) => `${Number(l.valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
  const montar = (linhas: Linha[], fmt: (l: Linha) => string) =>
    linhas.map((l) => ({ id: l.user_id, nome: nomeCurto(l.nome), valor: fmt(l), eu: l.user_id === user.id }));
  const boards: Board[] = [
    { chave: "longa", aba: "Mais longa", titulo: "Corrida mais longa da semana", regra: "A maior corrida contínua da semana (até 2 min de pausa).", linhas: montar(ord(longa), km1) },
    { chave: "rapida", aba: "Mais rápida", titulo: "Corrida mais rápida da semana", regra: "Melhor pace médio em corridas de 5 km ou mais.", linhas: montar(ord(rapida, true), (l) => pace(Number(l.valor))) },
    { chave: "km", aba: "Km da semana", titulo: "Maior quilometragem da semana", regra: "Soma de todas as corridas da semana.", linhas: montar(ord(km), km1) },
    { chave: "mes", aba: "Km do mês", titulo: `Quilometragem de ${m.nome}`, regra: "Soma de todas as corridas do mês.", linhas: montar(ord(kmMes), km1) },
    {
      chave: "semestre",
      aba: "Semestre",
      titulo: `Constância · ${sem.nome}`,
      regra: `Quem completar mais semanas no semestre. Semana completa = ${META_CORRIDAS} corridas de ${META_KM} km ou mais, de segunda a domingo. Desempate: km no semestre.`,
      linhas: semLinhas.map((l) => ({ id: l.user_id, nome: nomeCurto(l.nome), valor: semanas(l.total), eu: l.user_id === user.id })),
    },
  ];

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
                    <a className="connect-strava" href="/strava/conectar">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/strava/connect-with-strava.svg" width={237} height={48} alt="Connect with Strava" />
                    </a>
                  </>
                )}
              </div>

              <div className="semana-nav">
                <b>Semana de {dataBR(s.segunda)} a {dataBR(s.domingo)}</b>
                {passada ? <Link href="/aluno/ranking">Ver semana atual →</Link> : <Link href="/aluno/ranking?semana=passada">← Semana passada</Link>}
              </div>

              {conectado && (
                <div className="meu-semestre">
                  <div><span className="ms-num">{new Set(minhaSem?.semanas_ok ?? []).size}</span><span className="ms-rot">semanas completas no semestre</span></div>
                  <div><span className="ms-num">{Math.min(estaSemana ?? 0, META_CORRIDAS)}/{META_CORRIDAS}</span><span className="ms-rot">corridas de {META_KM} km+ nesta semana</span></div>
                  <div><span className="ms-num">{minhaSeq.atual}</span><span className="ms-rot">{minhaSeq.atual === 1 ? "semana seguida (sua sequência)" : "semanas seguidas (sua sequência)"}</span></div>
                </div>
              )}

              <AbasRanking boards={boards} />
              <p className="regra" style={{ marginTop: 14 }}>Valem corridas de rua, trilha e esteira. Caminhadas não contam. Os 3 primeiros de cada quadro levam medalha.</p>

              <h2 style={{ marginTop: 48, fontSize: "clamp(24px,3vw,32px)" }}>Minhas últimas corridas</h2>
              <div style={{ overflowX: "auto", marginTop: 14 }}>
                <table className="tabela">
                  <thead><tr><th>Data</th><th>Hora</th><th>Treino</th><th>Distância</th><th>Pace</th><th>Pausas</th><th></th></tr></thead>
                  <tbody>
                    {(minhas ?? []).length === 0 && <tr><td colSpan={7}>Nenhuma corrida importada ainda.</td></tr>}
                    {(minhas ?? []).map((a) => (
                      <tr key={a.id}>
                        <td>{dataBR(a.inicio_local)}</td>
                        <td>{a.inicio_local.slice(11, 16).replace(":", "h")}</td>
                        <td><span className="treino-nome"><IconeHorario inicioLocal={a.inicio_local} />{a.nome ?? "Corrida"}{a.esteira ? " · esteira" : ""}</span></td>
                        <td>{(Number(a.distancia_m) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km</td>
                        <td>{pace(a.tempo_mov_s / (Number(a.distancia_m) / 1000))}</td>
                        <td>{Math.round((a.tempo_total_s - a.tempo_mov_s) / 60)} min</td>
                        <td><a className="ver-strava" href={`https://www.strava.com/activities/${a.id}`} target="_blank" rel="noopener noreferrer">View on Strava</a></td>
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
              <p className="powered">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/strava/powered-by-strava.svg" width={146} height={15} alt="Powered by Strava" />
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
