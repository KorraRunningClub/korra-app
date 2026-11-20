// Datas no fuso de Florianópolis. Semana = segunda 00:00 até domingo 23:59.
const FUSO = "America/Sao_Paulo";

export function hojeSP(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: FUSO });
}

function somarDias(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** deslocamento 0 = semana atual, -1 = semana passada. */
export function semana(deslocamento = 0) {
  const hoje = hojeSP();
  const dow = new Date(`${hoje}T12:00:00Z`).getUTCDay(); // 0 = domingo
  const segunda = somarDias(hoje, -((dow + 6) % 7) + 7 * deslocamento);
  const proxima = somarDias(segunda, 7);
  return { inicio: `${segunda}T00:00:00`, fim: `${proxima}T00:00:00`, segunda, domingo: somarDias(segunda, 6) };
}

export function mes(deslocamento = 0) {
  const [a, m] = hojeSP().split("-").map(Number);
  const d0 = new Date(Date.UTC(a, m - 1 + deslocamento, 1));
  const d1 = new Date(Date.UTC(a, m + deslocamento, 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    inicio: `${iso(d0)}T00:00:00`,
    fim: `${iso(d1)}T00:00:00`,
    nome: d0.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}

export const dataBR = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

export function pace(segPorKm: number) {
  const m = Math.floor(segPorKm / 60);
  const s = Math.round(segPorKm % 60);
  return `${m}:${String(s === 60 ? 0 : s).padStart(2, "0")}/km`;
}
