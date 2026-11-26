import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { FASES_MACRO } from "@/lib/macrociclo";
import { MICROCICLOS } from "@/lib/microciclos";
import { ZONAS_VDOT } from "@/lib/zonas";

export const metadata = { title: "Metodologia · Korrá Running Club" };

export default async function MetodologiaPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/metodologia");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { perfil } = sessao;
  const q = (lista: readonly string[]) => (lista.length === 1 ? lista[0] : lista.map((t, i) => <span key={i} className="q-linha"><b>Q{i + 1}</b> {t}</span>));

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap" style={{ maxWidth: 980 }}>
          <div className="eyebrow">Só você vê</div>
          <h1 style={{ marginTop: 14 }}>Metodologia Korrá</h1>
          <p style={{ marginTop: 10, maxWidth: 720 }}>
            O resumo de como a Korrá organiza o treinamento: macrociclo, microciclos e zonas. Os alunos não veem esta página.
            Serve para consulta e para passar o método a um treinador parceiro.
          </p>
          <nav className="met-indice">
            <a href="#macro">Macrociclo</a><a href="#enfase">Treinos de qualidade por fase</a><a href="#micro">Microciclos</a><a href="#zonas">Zonas (VDOT)</a>
          </nav>

          <section id="macro" className="met-secao">
            <h2>1. Macrociclo: as 4 fases</h2>
            <div className="met-fases">
              {FASES_MACRO.map((f) => (
                <div key={f.n} className="met-fase">
                  <span className="met-fase-n">Fase {f.n}</span>
                  <b>{f.titulo}</b>
                  <p>{f.objetivo}</p>
                </div>
              ))}
            </div>
            <p className="met-nota">Potência aeróbia (fase III) = VO2máx (zona 5 / I de Daniels).</p>
          </section>

          <section id="enfase" className="met-secao">
            <h2>2. Ênfase dos treinos de qualidade por fase</h2>
            <p className="met-nota">Q1, Q2 e Q3 são os treinos de qualidade da semana, na ordem de prioridade.</p>
            <div style={{ overflowX: "auto" }}>
              <table className="tabela met-tabela">
                <thead><tr><th>Fase</th><th>5K até 15K</th><th>Meia maratona e maratona</th></tr></thead>
                <tbody>
                  {FASES_MACRO.map((f) => (
                    <tr key={f.n}><td><b>{f.n}</b> · {f.titulo}</td><td>{q(f.curta)}</td><td>{q(f.maratona)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="micro" className="met-secao">
            <h2>3. Microciclos</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="tabela micro-tabela">
                <thead><tr><th>Microciclo</th><th>Qualidade</th><th>Regra</th></tr></thead>
                <tbody>
                  {Object.entries(MICROCICLOS).map(([k, m]) => (
                    <tr key={k}><td><span className={`micro-tag micro-${k}`}>{m.nome}</span></td><td>{m.qMin === m.qMax ? m.qMin : `${m.qMin} a ${m.qMax}`}</td><td>{m.regra}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="met-nota">No app, conta como qualidade a corrida marcada como Intervalado, Fartlek ou Teste (prova não conta). Os microciclos de cada aluno são definidos em <Link href="/treinador/ciclos">Ciclos das provas-alvo</Link>.</p>
          </section>

          <section id="zonas" className="met-secao">
            <h2>4. Zonas de treino (% do VDOT)</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="tabela">
                <thead><tr><th>Zona</th><th>Nome</th><th>Daniels</th><th>% VDOT</th><th>Uso</th></tr></thead>
                <tbody>
                  {ZONAS_VDOT.map((z) => (
                    <tr key={z.n}><td><b>Z{z.n}</b></td><td>{z.nome}</td><td>{z.daniels || "—"}</td><td>{z.min}–{z.max}%</td><td>{z.uso}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="met-nota">VDOT calculado pelos testes de 1600 m, 2400 m, 3000 m ou 5000 m (Daniels &amp; Gilbert). Os ritmos de cada atleta ficam na página dele.</p>
          </section>
        </div>
      </main>
    </>
  );
}
