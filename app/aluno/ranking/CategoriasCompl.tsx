"use client";

import { useState } from "react";
import { CATEGORIAS_COMPL } from "@/lib/treinos";

// Botões de categoria do treino complementar; dá para marcar mais de um.
export function CategoriasCompl({ id, inicial }: { id: string; inicial: string[] }) {
  const [sel, setSel] = useState<string[]>(inicial);
  const [erro, setErro] = useState(false);
  const alternar = async (c: string) => {
    const antes = sel;
    const novo = sel.includes(c) ? sel.filter((x) => x !== c) : [...sel, c];
    setSel(novo);
    setErro(false);
    try {
      const r = await fetch("/aluno/treino-categorias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, categorias: novo }) });
      if (!r.ok) throw new Error();
    } catch {
      setSel(antes);
      setErro(true);
    }
  };
  return (
    <div className="tipo-treino" role="group" aria-label="O que você treinou">
      {CATEGORIAS_COMPL.map((c) => (
        <button key={c.id} type="button" aria-pressed={sel.includes(c.id)} className={sel.includes(c.id) ? "ativo" : undefined} onClick={() => alternar(c.id)}>
          {c.nome}
        </button>
      ))}
      {erro && <span className="tipo-erro">Não salvou, tente de novo.</span>}
    </div>
  );
}
