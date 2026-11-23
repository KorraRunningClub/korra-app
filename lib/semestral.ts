import type { SupabaseClient } from "@supabase/supabase-js";
import { hojeSP, semana } from "@/lib/semana";
import { tokenDoAluno } from "@/lib/strava";

// Regra do ranking semestral (fácil de mudar aqui):
export const META_CORRIDAS = 3; // corridas por semana
export const META_KM = 3; // distância mínima de cada corrida (km)
const TIPOS = new Set(["Run", "TrailRun", "VirtualRun"]);

function somarDias(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const segundaDe = (dia: string) => somarDias(dia, -((new Date(`${dia}T12:00:00Z`).getUTCDay() + 6) % 7));

/** Semestre 1 = jan–jun, 2 = jul–dez. Uma semana pertence ao semestre da sua segunda-feira. */
export function semestre(deslocamento = 0) {
  const [a, m] = hojeSP().split("-").map(Number);
  const idx = a * 2 + (m <= 6 ? 0 : 1) + deslocamento;
  const ano = Math.floor(idx / 2);
  const s = (idx % 2) + 1;
  const inicio = s === 1 ? `${ano}-01-01` : `${ano}-07-01`;
  const fim = s === 1 ? `${ano}-07-01` : `${ano + 1}-01-01`;
  return { chave: `${ano}-${s}`, inicio, fim, nome: `${s}º semestre de ${ano}` };
}

type Atv = { type: string; sport_type?: string; start_date_local: string; distance: number };

/** Busca no Strava as corridas do semestre e guarda só o resumo (semanas que bateram a meta + km). */
export async function recalcularSemestre(admin: SupabaseClient, userId: string) {
  const sem = semestre(0);
  const token = await tokenDoAluno(admin, userId);
  if (!token) return null;
  const depois = Math.floor(new Date(`${sem.inicio}T00:00:00-03:00`).getTime() / 1000) - 86400;
  const porSemana = new Map<string, number>();
  let metros = 0;
  let corridas = 0;
  for (let pagina = 1; pagina <= 5; pagina++) {
    const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${depois}&per_page=200&page=${pagina}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`Strava semestre ${r.status}`);
    const lista: Atv[] = await r.json();
    for (const a of lista) {
      if (!TIPOS.has(a.sport_type || a.type) || !a.distance) continue;
      const dia = a.start_date_local.slice(0, 10);
      const seg = segundaDe(dia);
      if (seg < sem.inicio || seg >= sem.fim) continue;
      metros += a.distance;
      corridas++;
      if (a.distance >= META_KM * 1000) porSemana.set(seg, (porSemana.get(seg) ?? 0) + 1);
    }
    if (lista.length < 200) break;
  }
  const semanas_ok = [...porSemana].filter(([, n]) => n >= META_CORRIDAS).map(([s]) => s).sort();
  const { error } = await admin.from("sequencias_semestre").upsert({
    user_id: userId,
    semestre: sem.chave,
    semanas_ok,
    km_total: Math.round(metros / 10) / 100,
    corridas,
    atualizado_em: new Date().toISOString(),
  });
  if (error) throw error;
  return semanas_ok.length;
}

/** Recalcula sem deixar um erro do semestral atrapalhar o resto. */
export async function recalcularSemestreSeguro(admin: SupabaseClient, userId: string) {
  try {
    await recalcularSemestre(admin, userId);
  } catch (e) {
    console.error("semestral", e);
  }
}

/** Maior sequência e sequência atual (bônus mostrado ao aluno) (a semana em andamento não quebra a sequência). */
export function sequencias(semanasOk: string[]) {
  const set = new Set(semanasOk.map((d) => d.slice(0, 10)));
  const ordenadas = [...set].sort();
  let maior = 0;
  let corrida = 0;
  let anterior = "";
  for (const s of ordenadas) {
    corrida = anterior && somarDias(anterior, 7) === s ? corrida + 1 : 1;
    maior = Math.max(maior, corrida);
    anterior = s;
  }
  let cursor = semana(0).segunda;
  if (!set.has(cursor)) cursor = somarDias(cursor, -7);
  let atual = 0;
  while (set.has(cursor)) {
    atual++;
    cursor = somarDias(cursor, -7);
  }
  return { maior, atual };
}
