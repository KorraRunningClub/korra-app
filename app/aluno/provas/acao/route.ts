import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { hojeSP } from "@/lib/semana";
import { DISTANCIAS, lerTempo, ufValida } from "@/lib/provas";

const txt = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const ancora = txt(form.get("ancora"), 30) || "minhas";
  const ir = (q: string) => NextResponse.redirect(new URL(`/aluno/provas${q}#${ancora}`, request.url), { status: 303 });
  const sessao = await getSessao();
  if (!sessao) return NextResponse.redirect(new URL("/entrar?voltar=/aluno/provas", request.url), { status: 303 });
  const { supabase: db, user } = sessao;
  const acao = txt(form.get("acao"), 30);
  const categoria = form.get("categoria") === "alvo" ? "alvo" : "secundaria";

  try {
    if (acao === "inscrever" || acao === "nova") {
      let provaId = txt(form.get("prova_id"), 40);
      if (acao === "nova") {
        const nome = txt(form.get("nome"), 120);
        const data = txt(form.get("data"), 10);
        const distancia = txt(form.get("distancia"), 10);
        const km = Number(txt(form.get("distancia_km"), 8).replace(",", "."));
        const cidade = txt(form.get("cidade"), 80) || null;
        const uf = txt(form.get("uf"), 2).toUpperCase();
        if (!ufValida(uf)) return ir("?erro=uf");
        let link = txt(form.get("link"), 300) || null;
        if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`;
        if (nome.length < 3) return ir("?erro=nome");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data < hojeSP()) return ir("?erro=data");
        if (!(distancia in DISTANCIAS)) return ir("?erro=distancia");
        const linha = {
          nome, data, distancia, cidade, link, uf, criado_por: user.id,
          distancia_km: (distancia === "trail" || distancia === "outra") && km > 0 ? km : null,
        };
        const { data: nova, error } = await db.from("provas").insert(linha).select("id").single();
        if (error?.code === "23505") {
          // já existe: usa a que está cadastrada
          const { data: existente } = await db.from("provas").select("id").ilike("nome", nome).eq("data", data).eq("distancia", distancia).limit(1).single();
          if (!existente) throw error;
          provaId = existente.id;
        } else if (error) throw error;
        else provaId = nova.id;
      }
      if (!provaId) return ir("?erro=escolha");
      const { error } = await db.from("prova_inscricoes").insert({ prova_id: provaId, user_id: user.id, categoria });
      if (error?.code === "23505") return ir("?erro=ja_inscrito");
      if (error) throw error;
      return ir("?ok=inscrito");
    }

    if (acao === "uf_casa") {
      const uf = txt(form.get("uf"), 2).toUpperCase();
      if (!ufValida(uf) || uf === "EX") return ir("?erro=uf");
      const { error } = await db.from("perfis").update({ uf_casa: uf }).eq("id", user.id);
      if (error) throw error;
      return ir("?ok=uf_casa");
    }
    if (acao === "uf_prova") {
      const uf = txt(form.get("uf"), 2).toUpperCase();
      if (!ufValida(uf)) return ir("?erro=uf");
      const { error } = await db.from("provas").update({ uf }).eq("id", txt(form.get("prova_id"), 40));
      if (error) throw error;
      return ir("?ok=uf_prova");
    }

    const id = txt(form.get("id"), 40);
    const minha = db.from("prova_inscricoes");
    if (acao === "categoria") {
      const { error } = await minha.update({ categoria }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return ir("?ok=categoria");
    }
    if (acao === "tempo") {
      const seg = lerTempo(txt(form.get("tempo"), 12));
      if (!seg) return ir("?erro=tempo");
      const { error } = await minha.update({ tempo_oficial_s: seg, status: "concluida" }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return ir("?ok=tempo");
    }
    if (acao === "nao_correu") {
      const { error } = await minha.update({ status: "nao_correu", tempo_oficial_s: null }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return ir("?ok=nao_correu");
    }
    if (acao === "remover") {
      const { error } = await minha.delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return ir("?ok=removida");
    }
  } catch (e) {
    console.error("provas", e);
    const codigo = (e as { code?: string })?.code ?? "";
    if (codigo === "42P01" || codigo === "PGRST205") return ir("?erro=tabela");
    return ir("?erro=salvar");
  }
  return ir("");
}
