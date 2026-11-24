import Link from "next/link";
import { getSessao } from "@/lib/supabase/server";
import { gerarAvisos } from "@/lib/personal";

// Sininho do treinador com a quantidade de mensagens não lidas.
export async function SinoAvisos() {
  const sessao = await getSessao().catch(() => null);
  if (!sessao || sessao.perfil?.papel !== "treinador") return null;
  try {
    await gerarAvisos(sessao.supabase, sessao.user.id);
  } catch {}
  const { count } = await sessao.supabase.from("notificacoes").select("id", { count: "exact", head: true }).eq("lida", false);
  const n = count ?? 0;
  return (
    <Link className={`sino${n ? " tem" : ""}`} href="/treinador/mensagens" aria-label={n ? `${n} mensagens novas` : "Mensagens"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      </svg>
      {n > 0 && <span>{n > 9 ? "9+" : n}</span>}
    </Link>
  );
}
