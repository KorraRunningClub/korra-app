import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { FASES_MACRO } from "@/lib/macrociclo";
import { MICROCICLOS } from "@/lib/microciclos";
import { ZONAS_VDOT } from "@/lib/zonas";
import { GraficoCarga } from "./GraficoCarga";

export const metadata = { title: "Metodologia · Korrá Running Club" };

const DUVIDAS: { p: string; r: React.ReactNode }[] = [
  { p: "Qual o ritmo do treino longo tradicional na base?", r: "Nos períodos de base: 15 a 20% mais lento que o ritmo de 10 km." },
  { p: "Em que pace devo fazer os treinos longos na fase específica?", r: "Na fase específica, o atleta corre em torno de 5 a 7% mais lento que o ritmo pretendido para a prova." },
  { p: "Qual o tempo ideal para um treino de limiar?", r: <ul><li><b>Iniciantes:</b> 20 a 25 min</li><li><b>Intermediários:</b> 25 a 35 min</li><li><b>Avançados:</b> 35 a 50 min</li></ul> },
  { p: "Qual a diferença entre limiar contínuo e limiar fracionado?", r: "No início da temporada, o fracionado se encaixa melhor." },
  { p: "Quanto tempo é possível suportar na velocidade do VO2máx?", r: <ul><li><b>Iniciantes:</b> 7 a 8 min</li><li><b>Intermediários:</b> 8 a 9 min</li><li><b>Avançados:</b> 10 a 12 min</li></ul> },
  { p: "Quanto tempo levamos para chegar no VO2máx?", r: "Algo em torno de 1 min 30 s." },
  { p: "Quais os melhores tempos de exposição (cada tiro) para estimular o VO2máx?", r: <ul><li><b>Iniciantes:</b> 2 a 3 min</li><li><b>Intermediários:</b> 4 a 5 min</li><li><b>Avançados:</b> 4 a 7 min</li></ul> },
  { p: "Qual o volume total dos treinos de VO2máx?", r: <ul><li><b>Iniciantes:</b> 8 min</li><li><b>Intermediários:</b> 10 a 15 min</li><li><b>Avançados:</b> 15 a 20 min</li></ul> },
  { p: "O atleta tem 3 dias seguidos para treinar. Como colocar a qualidade?", r: <ul><li><b>Semanas pares:</b> limiar → aeróbico leve → longo</li><li><b>Semanas ímpares:</b> VO2máx → aeróbico leve → longo com estímulos em limiar no final</li></ul> },
];


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
            <a href="#macro">Macrociclo</a><a href="#enfase">Treinos de qualidade por fase</a><a href="#micro">Microciclos</a><a href="#zonas">Zonas (VDOT)</a><a href="#duvidas">Dúvidas frequentes</a><a href="#carga">Controle de carga</a>
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

          <section id="duvidas" className="met-secao">
            <h2>5. Dúvidas frequentes</h2>
            <div className="faq-met">
              {DUVIDAS.map((d, i) => (
                <details key={i}>
                  <summary>{d.p}</summary>
                  <div className="faq-met-r">{d.r}</div>
                </details>
              ))}
            </div>
          </section>

          <section id="carga" className="met-secao">
            <h2>6. Controle de carga</h2>
            <ul className="carga-regras">
              <li>O volume em <b>VO2máx</b> não pode passar de <b>10%</b> do volume semanal do atleta.</li>
              <li>Nas séries de <b>repetição</b>, o volume da série não pode passar de <b>5%</b> do volume semanal do atleta.</li>
            </ul>
            <p className="met-nota">O <b>limiar</b> não entra nessa conta em %: ele é controlado pela velocidade do atleta e pelo tempo de exposição (veja os tempos em <a href="#duvidas">Dúvidas frequentes</a>).</p>
            <p className="met-nota">Exemplo hipotético: mude o nome e o volume para ver os limites de cada atleta.</p>
            <GraficoCarga />
          </section>
        </div>
      </main>
    </>
  );
}
