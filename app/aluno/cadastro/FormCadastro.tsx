"use client";

import { useActionState, useState } from "react";
import { salvarCadastro, type EstadoCadastro } from "./actions";
import { OBJETIVOS, formatarTelefone, idade } from "@/lib/cadastro";

export type DadosCadastro = {
  nome: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  objetivo: string | null;
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
  consentimento_responsavel: boolean;
  autoriza_imagem: boolean;
  cadastro_completo: boolean;
};

export function FormCadastro({ dados }: { dados: DadosCadastro }) {
  const [estado, enviar, salvando] = useActionState<EstadoCadastro, FormData>(salvarCadastro, {});
  const [nascimento, setNascimento] = useState(dados.data_nascimento ?? "");
  const anos = idade(nascimento);
  const menor = anos !== null && anos < 18;
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <form action={enviar} className="panel form-cadastro">
      <div className="field">
        <label htmlFor="nome">Nome completo</label>
        <input id="nome" name="nome" autoComplete="name" required defaultValue={dados.nome ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="telefone">WhatsApp (com DDD)</label>
        <input id="telefone" name="telefone" type="tel" inputMode="tel" autoComplete="tel" required
          placeholder="(48) 99999-9999" defaultValue={formatarTelefone(dados.telefone)} />
      </div>

      <div className="field">
        <label htmlFor="data_nascimento">Data de nascimento</label>
        <input id="data_nascimento" name="data_nascimento" type="date" required max={hoje}
          value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="objetivo">Seu objetivo principal</label>
        <select id="objetivo" name="objetivo" required defaultValue={dados.objetivo ?? ""}>
          <option value="" disabled>Escolha uma opção</option>
          {OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {menor && (
        <fieldset className="bloco-responsavel">
          <legend>Responsável</legend>
          <p>Como você tem menos de 18 anos, precisamos dos dados e da autorização de um responsável.</p>
          <div className="field">
            <label htmlFor="responsavel_nome">Nome completo do responsável</label>
            <input id="responsavel_nome" name="responsavel_nome" required defaultValue={dados.responsavel_nome ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="responsavel_telefone">WhatsApp do responsável</label>
            <input id="responsavel_telefone" name="responsavel_telefone" type="tel" inputMode="tel" required
              placeholder="(48) 99999-9999" defaultValue={formatarTelefone(dados.responsavel_telefone)} />
          </div>
          <label className="check">
            <input type="checkbox" name="consentimento_responsavel" defaultChecked={dados.consentimento_responsavel} required />
            <span>Eu, responsável, autorizo a participação nos treinos da Korrá Running Club e o uso dos dados acima pela assessoria.</span>
          </label>
        </fieldset>
      )}

      <label className="check">
        <input type="checkbox" name="autoriza_imagem" defaultChecked={dados.autoriza_imagem} />
        <span>Autorizo o uso de fotos e vídeos dos treinos em que eu apareço no site e nas redes da Korrá. (Opcional)</span>
      </label>

      <label className="check">
        <input type="checkbox" name="aceite_termos" defaultChecked={dados.cadastro_completo} required />
        <span>Li e concordo com a <a href="/privacidade" target="_blank">Política de Privacidade</a> e os <a href="/termos" target="_blank">Termos de Uso</a>. A Korrá usa estes dados para organizar meus treinos, a comunicação e a mensalidade.</span>
      </label>

      {estado.erro && <p className="msg erro" role="alert">{estado.erro}</p>}

      <button className="btn btn-primary" type="submit" disabled={salvando}>
        {salvando ? "Salvando…" : dados.cadastro_completo ? "Salvar alterações →" : "Concluir cadastro →"}
      </button>
    </form>
  );
}
