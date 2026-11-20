export const ABAS = { conteudos: "Conteúdos", dicas: "Dicas" } as const;
export type Aba = keyof typeof ABAS;

export const CATEGORIAS_FORUM = {
  tecnica: { nome: "Técnica e educativos", aba: "conteudos" },
  forca: { nome: "Força e pliometria", aba: "conteudos" },
  fisioterapia: { nome: "Fisioterapia", aba: "dicas" },
  nutricao: { nome: "Nutrição", aba: "dicas" },
  massoterapia: { nome: "Massoterapia", aba: "dicas" },
  provas: { nome: "Provas e equipamentos", aba: "dicas" },
} as const;
export type CategoriaForum = keyof typeof CATEGORIAS_FORUM;

/** Extrai o ID de um link do YouTube (watch, youtu.be, shorts, embed). */
export function idYoutube(url: string): string | null {
  const s = url.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1, 12) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v.slice(0, 11);
      const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export function nomeCurto(n: string | null) {
  if (!n) return "Aluno";
  const p = n.trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
}

export function quando(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
}
