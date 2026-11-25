"use client";

import { useState } from "react";
import { COMPANHIAS, TIPOS_TREINO } from "@/lib/treinos";

type Opcao = { readonly id: string; readonly nome: string };

// Uma linha de botões; clicar de novo no marcado desmarca.
function Linha({ atividadeId, campo, opcoes, inicial, rotulo }: { atividadeId: number; campo: "tipo" | "companhia"; opcoes: readonly Opcao[]; inicial: string | null; rotulo: string }) {
  const [valor, setValor] = useState<string | null>(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);

  const marcar = async (novo: string) => {
    const proximo = valor === novo ? null : novo;
    const antes = valor;
    setValor(proximo);
    setSalvando(true);
    setErro(false);
    try {
      const r = await fetch("/aluno/treino-tipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: atividadeId, campo, valor: proximo }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setValor(antes);
      setErro(true);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={`tipo-treino ${campo}${salvando ? " salvando" : ""}`} role="group" aria-label={rotulo}>
      {opcoes.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={valor === t.id}
          className={[valor === t.id ? "ativo" : "", t.id === "prova" ? "prova" : t.id === "teste" ? "teste" : ""].filter(Boolean).join(" ") || undefined}
          onClick={() => marcar(t.id)}
        >
          {t.nome}
        </button>
      ))}
      {erro && <span className="tipo-erro">Não salvou, tente de novo.</span>}
    </div>
  );
}

export function TipoTreino({ atividadeId, inicial, companhia }: { atividadeId: number; inicial: string | null; companhia?: string | null }) {
  return (
    <>
      <Linha atividadeId={atividadeId} campo="tipo" opcoes={TIPOS_TREINO} inicial={inicial} rotulo="Tipo do treino" />
      <Linha atividadeId={atividadeId} campo="companhia" opcoes={COMPANHIAS} inicial={companhia ?? null} rotulo="Com quem correu" />
    </>
  );
}
