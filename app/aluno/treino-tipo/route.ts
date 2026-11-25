import { NextResponse, type NextRequest } from "next/server";
import { getSessao } from "@/lib/supabase/server";
import { ehCompanhia, ehTipoTreino } from "@/lib/treinos";
import { createAdmin } from "@/lib/supabase/admin";
import { TESTES, mmss, type Teste } from "@/lib/zonas";

// Marca (ou desmarca) o tipo do treino ou com quem o aluno correu.
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "login" }, { status: 401 });
  const { supabase, user } = sessao;
  const corpo = (await request.json().catch(() => null)) as
    | { id?: number | string; campo?: string; valor?: string | null; tipo?: string | null }
    | null;
  const id = Number(corpo?.id);
  if (!Number.isFinite(id)) return NextResponse.json({ erro: "id" }, { status: 400 });
  const campo = corpo?.campo === "companhia" ? "companhia" : "tipo";
  const valor = (corpo?.valor ?? corpo?.tipo ?? null) || null;
  if (valor && !(campo === "tipo" ? ehTipoTreino(valor) : ehCompanhia(valor)))
    return NextResponse.json({ erro: "valor" }, { status: 400 });

  const { data: atv } = await supabase.from("atividades").select("id, inicio_local, distancia_m, tempo_mov_s").eq("id", id).eq("user_id", user.id).single();
  if (!atv) return NextResponse.json({ erro: "atividade" }, { status: 404 });

  const { data: linha, error } = await supabase
    .from("treino_marcacoes")
    .upsert({ atividade_id: id, user_id: user.id, [campo]: valor, data: String(atv.inicio_local).slice(0, 10), marcado_em: new Date().toISOString() })
    .select("tipo, companhia")
    .single();
  if (error) {
    console.error("treino marcacao", error);
    return NextResponse.json({ erro: "salvar" }, { status: 500 });
  }
  // "Teste": vira teste automaticamente nas zonas (pela distância da corrida) e avisa o treinador
  if (campo === "tipo") {
    try {
      const admin = createAdmin();
      if (valor === "teste") {
        const metros = Number(atv.distancia_m);
        const teste = (Object.entries(TESTES).find(([, t]) => Math.abs(metros - t.metros) / t.metros <= 0.12)?.[0] ?? null) as Teste | null;
        const { data: ja } = await admin.from("testes_zonas").select("id").eq("atividade_id", id).maybeSingle();
        let resumo = "A distância não bate com 1600 m, 3000 m ou 5 km: registre o tempo do trecho do teste.";
        if (teste && !ja) {
          const { error: eT } = await admin.from("testes_zonas").insert({
            user_id: user.id, teste, data: String(atv.inicio_local).slice(0, 10), tempo_s: atv.tempo_mov_s,
            atividade_id: id, obs: "marcado pelo aluno",
          });
          if (eT) throw eT;
          resumo = `${TESTES[teste].curto} em ${mmss(atv.tempo_mov_s)}: zonas atualizadas. Confira se o tempo é só do teste.`;
        } else if (ja) resumo = "Esse teste já estava registrado.";
        const [{ data: treinadores }, { data: eu }] = await Promise.all([
          admin.from("perfis").select("id").eq("papel", "treinador"),
          admin.from("perfis").select("nome").eq("id", user.id).single(),
        ]);
        const dia = String(atv.inicio_local).slice(0, 10).split("-").reverse().join("/");
        if (treinadores?.length) await admin.from("notificacoes").upsert(
          treinadores.map((t) => ({
            dono: t.id,
            chave: `teste:${id}`,
            titulo: `${eu?.nome ?? "Um aluno"} fez um teste (${dia})`,
            texto: resumo,
            link: teste ? `/treinador/aluno/${user.id}?aba=progresso` : `/treinador/aluno/${user.id}?aba=atividades&teste_de=${id}#marcar`,
          })),
          { onConflict: "dono,chave", ignoreDuplicates: true },
        );
      } else {
        // desmarcou "Teste": tira o teste que o próprio aluno tinha gerado
        await admin.from("testes_zonas").delete().eq("atividade_id", id).eq("user_id", user.id).eq("obs", "marcado pelo aluno");
      }
    } catch (e) {
      console.error("teste automático", e);
    }
  }
  // nada marcado: apaga a linha
  if (!linha.tipo && !linha.companhia) await supabase.from("treino_marcacoes").delete().eq("atividade_id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true, ...linha });
}
