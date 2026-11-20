import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessao } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { formatarTelefone, idade } from "@/lib/cadastro";

export const metadata = { title: "Painel do treinador · Korrá Running Club" };

const MENSALIDADE = 165;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function mudarStatus(formData: FormData) {
  "use server";
  const sessao = await getSessao();
  if (!sessao || sessao.perfil?.papel !== "treinador") return;
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["ativo", "pendente", "bloqueado"].includes(status)) return;
  await sessao.supabase.from("perfis").update({ status }).eq("id", id);
  revalidatePath("/treinador");
}

export default async function TreinadorPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const { supabase, perfil } = sessao;

  const { data: alunos } = await supabase
    .from("perfis")
    .select("id, nome, email, telefone, status, criado_em, data_nascimento, objetivo, responsavel_nome, responsavel_telefone, autoriza_imagem, cadastro_completo")
    .eq("papel", "aluno")
    .order("nome");

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const desde = inicioMes.toISOString().slice(0, 10);
  const { data: despesas } = await supabase
    .from("despesas")
    .select("valor")
    .gte("data", desde);

  const lista = alunos ?? [];
  const ativos = lista.filter((a) => a.status === "ativo").length;
  const totalDespesas = (despesas ?? []).reduce((s, d) => s + Number(d.valor), 0);
  const receitaPrevista = ativos * MENSALIDADE;

  return (
    <>
      <AppHeader nome={perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <div className="eyebrow">Painel do treinador</div>
          <h1 style={{ marginTop: "14px" }}>Visão do mês</h1>

          <div className="grid-cards">
            <div className="tile"><span className="k">Alunos ativos</span><span className="v">{ativos}</span><span>de {lista.length} cadastrados</span></div>
            <div className="tile"><span className="k">Receita prevista</span><span className="v">{brl(receitaPrevista)}</span><span>{ativos} × {brl(MENSALIDADE)}</span></div>
            <div className="tile"><span className="k">Despesas no mês</span><span className="v">{brl(totalDespesas)}</span><span>lançadas desde {inicioMes.toLocaleDateString("pt-BR")}</span></div>
            <div className="tile"><span className="k">Saldo previsto</span><span className="v">{brl(receitaPrevista - totalDespesas)}</span><span>receita − despesas</span></div>
          </div>

          <h2 style={{ marginTop: "56px", fontSize: "clamp(26px,3.4vw,36px)" }}>Alunos</h2>
          <div style={{ overflowX: "auto", marginTop: "18px" }}>
            <table className="tabela">
              <thead>
                <tr><th>Nome</th><th>Contato</th><th>Idade · objetivo</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {lista.length === 0 && (
                  <tr><td colSpan={5}>Nenhum aluno cadastrado ainda. Quando alguém entrar pela área do aluno, aparece aqui.</td></tr>
                )}
                {lista.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.nome ?? "—"}
                      {!a.cadastro_completo && <div className="sub">cadastro incompleto</div>}
                    </td>
                    <td>
                      {a.email}
                      {a.telefone && <div className="sub">{formatarTelefone(a.telefone)}</div>}
                    </td>
                    <td>
                      {idade(a.data_nascimento) ?? "—"}{idade(a.data_nascimento) !== null ? " anos" : ""}
                      {idade(a.data_nascimento) !== null && (idade(a.data_nascimento) as number) < 18 && (
                        <div className="sub">menor · resp.: {a.responsavel_nome} {formatarTelefone(a.responsavel_telefone)}</div>
                      )}
                      {a.objetivo && <div className="sub">{a.objetivo}</div>}
                      {a.cadastro_completo && !a.autoriza_imagem && <div className="sub">não autoriza imagem</div>}
                    </td>
                    <td><span className={`pill ${a.status}`}>{a.status}</span></td>
                    <td>
                      <form action={mudarStatus} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <input type="hidden" name="id" value={a.id} />
                        {a.status !== "ativo" && <button className="btn-link" name="status" value="ativo">Ativar</button>}
                        {a.status !== "bloqueado" && <button className="btn-link" name="status" value="bloqueado">Bloquear</button>}
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
