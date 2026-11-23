"use client";

import { useState } from "react";
import { TIPOS_TREINO } from "@/lib/treinos";

// Botões para o aluno marcar o tipo do treino. Clicar de novo no marcado desmarca.
export function TipoTreino({ atividadeId, inicial }: { atividadeId: number; inicial: string | null }) {
  const [tipo, setTipo] = useState<string | null>(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);

  const marcar = async (novo: string) => {
    const valor = tipo === novo ? null : novo;
    const antes = tipo;
    setTipo(valor);
    setSalvando(true);
    setErro(false);
    try {
      const r = await fetch("/aluno/treino-tipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: atividadeId, tipo: valor }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setTipo(antes);
      setErro(true);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={`tipo-treino${salvando ? " salvando" : ""}`} role="group" aria-label="Tipo do treino">
      {TIPOS_TREINO.map((t) => (
        <button key={t.id} type="button" aria-pressed={tipo === t.id} className={tipo === t.id ? "ativo" : undefined} onClick={() => marcar(t.id)}>
          {t.nome}
        </button>
      ))}
      {erro && <span className="tipo-erro">Não salvou, tente de novo.</span>}
    </div>
  );
}
