import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/AppHeader";
import { importarRecentes, tokenDoAluno } from "@/lib/strava";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnóstico do Strava · Korrá" };

type A = { id: number; name: string; type: string; sport_type?: string; start_date_local: string; distance: number };

// Página de conferência: mostra as últimas atividades do SEU Strava e o que entrou no app.
export default async function Diagnostico() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/treinador/diagnostico-strava");
  if (sessao.perfil?.papel !== "treinador") redirect("/aluno");
  const admin = createAdmin();
  const uid = sessao.user.id;
  let erro = "";
  let lista: A[] = [];
  let importadas = 0;
  try {
    const token = await tokenDoAluno(admin, uid);
    if (!token) erro = "Seu Strava não está conectado.";
    else {
      const r = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10", { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) erro = `Strava respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`;
      else lista = await r.json();
      importadas = await importarRecentes(admin, uid, 35);
    }
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }
  const ids = lista.map((a) => a.id);
  const [{ data: atv }, { data: ext, error: eExt }] = await Promise.all([
    admin.from("atividades").select("id").in("id", ids.length ? ids : [0]),
    admin.from("treinos_extras").select("strava_id, tipo").in("strava_id", ids.length ? ids : [0]),
  ]);
  const naCorrida = new Set((atv ?? []).map((a) => Number(a.id)));
  const noExtra = new Map((ext ?? []).map((e) => [Number(e.strava_id), e.tipo as string]));

  return (
    <>
      <AppHeader nome={sessao.perfil?.nome} treinador />
      <main className="app-shell">
        <div className="wrap">
          <h1>Diagnóstico do Strava</h1>
          <p style={{ marginTop: 10 }}>Últimas 10 atividades do seu Strava e onde cada uma entrou no app. (A página já roda o “Atualizar agora”.)</p>
          {erro && <p className="msg erro" style={{ marginTop: 14 }}>{erro}</p>}
          {eExt && <p className="msg erro" style={{ marginTop: 14 }}>Erro ao ler treinos extras: {eExt.message}</p>}
          <p className="regra" style={{ marginTop: 10 }}>Corridas importadas agora: {importadas}</p>
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table className="tabela">
              <thead><tr><th>Data</th><th>Nome</th><th>Tipo (type / sport_type)</th><th>Distância</th><th>No app</th></tr></thead>
              <tbody>
                {lista.map((a) => (
                  <tr key={a.id}>
                    <td>{a.start_date_local.slice(0, 16).replace("T", " ")}</td>
                    <td>{a.name}</td>
                    <td>{a.type} / {a.sport_type ?? "—"}</td>
                    <td>{(a.distance / 1000).toFixed(2)} km</td>
                    <td>{naCorrida.has(a.id) ? "Corrida ✓" : noExtra.has(a.id) ? `Extra (${noExtra.get(a.id)}) ✓` : "não entrou"}</td>
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
