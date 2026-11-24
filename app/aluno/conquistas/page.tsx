import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { Medalha } from "@/components/Medalha";
import { dataBR } from "@/lib/semana";
import { CATEGORIAS_CONQUISTA, CONQUISTAS, CORES_NIVEL } from "@/lib/conquistas";

export const metadata = { title: "Conquistas disponíveis · Korrá Running Club" };

export default async function ConquistasPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/conquistas");
  const { supabase, user, perfil } = sessao;
  const treinador = perfil?.papel === "treinador";
  const liberado = perfil?.status === "ativo" || treinador;

  // Provas concluídas (em ordem de data), para saber quando cada meta foi batida
  let feitas: { data: string; uf: string | null }[] = [];
  let ufCasa = "SC";
  if (liberado) {
    const [{ data }, { data: eu }] = await Promise.all([
      supabase.from("prova_inscricoes").select("provas(data, uf)").eq("user_id", user.id).eq("status", "concluida"),
      supabase.from("perfis").select("uf_casa").eq("id", user.id).maybeSingle<{ uf_casa: string | null }>(),
    ]);
    feitas = ((data ?? []) as unknown as { provas: { data: string; uf: string | null } | null }[])
      .map((r) => r.provas).filter((p): p is { data: string; uf: string | null } => Boolean(p)).sort((a, b) => a.data.localeCompare(b.data));
    ufCasa = eu?.uf_casa ?? "SC";
  }
  const fora = feitas.filter((p) => p.uf && p.uf !== ufCasa);
  // o que cada tipo de conquista conta
  const progresso: Record<string, { feito: number; datas: string[] }> = {
    provas: { feito: feitas.length, datas: feitas.map((p) => p.data) },
    provas_fora: { feito: fora.length, datas: fora.map((p) => p.data) },
  };
  const prog = (c: (typeof CONQUISTAS)[number]) => progresso[c.conta ?? c.categoria] ?? { feito: 0, datas: [] };
  const total = CONQUISTAS.filter((c) => prog(c).feito >= c.meta).length;

  return (
    <>
      <AppHeader nome={perfil?.nome ?? user.email} treinador={treinador} />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Ranking · Conquistas</div>
          <h1 style={{ marginTop: 14 }}>Conquistas disponíveis</h1>
          <p style={{ marginTop: 12, maxWidth: 640 }}>
            Medalhas que você desbloqueia treinando e correndo com a Korrá. As cinzas ainda estão te esperando.
          </p>
          {liberado && <p className="conq-total"><b>{total}</b> de {CONQUISTAS.length} conquistadas</p>}

          {!liberado ? (
            <p className="msg" style={{ marginTop: 24 }}>As conquistas liberam assim que sua matrícula estiver ativa.</p>
          ) : (
            Object.entries(CATEGORIAS_CONQUISTA).map(([cat, info]) => {
              const pc = progresso[cat] ?? { feito: 0, datas: [] };
              return (
                <section key={cat} style={{ marginTop: 40 }}>
                  <h2 className="sub-provas">{info.nome}</h2>
                  <p className="regra" style={{ marginTop: 6 }}>
                    {info.descricao} Você tem <b>{pc.feito}</b>.{" "}
                    {cat === "provas" && <Link href="/aluno/provas">Lançar uma prova →</Link>}
                  </p>
                  <div className="conq-grid">
                    {CONQUISTAS.filter((c) => c.categoria === cat).map((c) => {
                      const p = prog(c);
                      const ok = p.feito >= c.meta;
                      const pct = Math.min(100, Math.round((p.feito / c.meta) * 100));
                      return (
                        <div key={c.id} className={`conq-card${ok ? " ok" : ""}`}>
                          <Medalha nivel={c.nivel} numero={c.meta} liberada={ok} simbolo={c.simbolo} figura={c.figura} />
                          <span className="conq-nivel">{CORES_NIVEL[c.nivel].nome}</span>
                          <h3>{c.nome}</h3>
                          <p className="conq-regra">{c.regra ?? `${c.meta} ${c.unidade} concluídas`}</p>
                          {ok ? (
                            <p className="conq-data">Conquistada em {dataBR(p.datas[c.meta - 1] ?? "")}</p>
                          ) : (
                            <div className="conq-prog" aria-label={`${p.feito} de ${c.meta}`}>
                              <div className="barra"><span style={{ width: `${pct}%` }} /></div>
                              <span>{p.feito}/{c.meta}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
