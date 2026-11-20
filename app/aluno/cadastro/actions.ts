"use server";

import { redirect } from "next/navigation";
import { getSessao } from "@/lib/supabase/server";
import { OBJETIVOS, idade, limparTelefone } from "@/lib/cadastro";

export type EstadoCadastro = { erro?: string };

export async function salvarCadastro(_: EstadoCadastro, form: FormData): Promise<EstadoCadastro> {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar?voltar=/aluno/cadastro");

  const nome = String(form.get("nome") ?? "").trim().replace(/\s+/g, " ");
  const telefone = limparTelefone(String(form.get("telefone") ?? ""));
  const nascimento = String(form.get("data_nascimento") ?? "");
  const objetivo = String(form.get("objetivo") ?? "");
  const respNome = String(form.get("responsavel_nome") ?? "").trim();
  const respTel = limparTelefone(String(form.get("responsavel_telefone") ?? ""));
  const consentResp = form.get("consentimento_responsavel") === "on";
  const autorizaImagem = form.get("autoriza_imagem") === "on";
  const aceite = form.get("aceite_termos") === "on";

  if (nome.split(" ").length < 2) return { erro: "Escreva seu nome completo (nome e sobrenome)." };
  if (telefone.length < 10 || telefone.length > 11) return { erro: "Confira o WhatsApp: use DDD + número, por exemplo (48) 99999-9999." };
  const anos = idade(nascimento);
  if (anos === null || anos < 5 || anos > 100) return { erro: "Confira a data de nascimento." };
  if (!OBJETIVOS.includes(objetivo as (typeof OBJETIVOS)[number])) return { erro: "Escolha o seu objetivo principal." };

  const menor = anos < 18;
  if (menor) {
    if (respNome.split(" ").length < 2) return { erro: "Como você tem menos de 18 anos, precisamos do nome completo do seu responsável." };
    if (respTel.length < 10 || respTel.length > 11) return { erro: "Confira o WhatsApp do responsável, com DDD." };
    if (!consentResp) return { erro: "Precisamos da autorização do responsável para continuar." };
  }
  if (!aceite) return { erro: "Para continuar, aceite o uso dos seus dados pela assessoria." };

  const { error } = await sessao.supabase
    .from("perfis")
    .update({
      nome,
      telefone,
      data_nascimento: nascimento,
      objetivo,
      responsavel_nome: menor ? respNome : null,
      responsavel_telefone: menor ? respTel : null,
      consentimento_responsavel: menor ? consentResp : false,
      autoriza_imagem: autorizaImagem,
      aceite_termos_em: new Date().toISOString(),
      cadastro_completo: true,
    })
    .eq("id", sessao.user.id);

  if (error) return { erro: "Não conseguimos salvar agora. Tente de novo em instantes." };
  redirect("/aluno?salvo=1");
}
