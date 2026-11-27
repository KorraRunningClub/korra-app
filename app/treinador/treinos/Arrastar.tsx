"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";

// Arrastar e soltar treinos entre pastas e fases da biblioteca (no computador).
type Destino = { fase?: string; tipo?: string; subtipo?: string | null; rotulo: string };
type Arraste = { id: string; tipo: string; nome: string };
type Ctx = { arraste: Arraste | null; setArraste: (a: Arraste | null) => void; soltar: (d: Destino, x: number, y: number) => void };
const C = createContext<Ctx | null>(null);

// rodagem, regenerativo e longo têm o mesmo formato (bloco principal); intervalado só vai para pastas de intervalado
const compativel = (de: string, para?: string) => !para || (de === "intervalado" ? para === "intervalado" : para !== "intervalado");

export function ArrastarProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [arraste, setArraste] = useState<Arraste | null>(null);
  const [pend, setPend] = useState<{ a: Arraste; d: Destino; x: number; y: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(false);
  const enviar = async (acao: "copiar" | "mover") => {
    if (!pend) return;
    setEnviando(true); setErro(false);
    try {
      const r = await fetch("/treinador/treinos/mover", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pend.a.id, acao, fase: pend.d.fase, tipo: pend.d.tipo, subtipo: pend.d.subtipo }),
      });
      if (!r.ok) throw new Error();
      setPend(null);
      router.refresh();
    } catch { setErro(true); } finally { setEnviando(false); }
  };
  return (
    <C.Provider value={{ arraste, setArraste, soltar: (d, x, y) => { if (arraste) setPend({ a: arraste, d, x, y }); setArraste(null); } }}>
      {children}
      {pend && (
        <div className="arrastar-menu" style={{ left: Math.min(pend.x, (typeof window !== "undefined" ? window.innerWidth : 800) - 270), top: pend.y + 8 }} role="dialog" aria-label="Copiar ou mover">
          <p><b>{pend.a.nome}</b> → {pend.d.rotulo}</p>
          <div>
            <button className="btn btn-primary" disabled={enviando} onClick={() => enviar("copiar")}>Copiar aqui</button>
            <button className="btn btn-ghost" disabled={enviando} onClick={() => enviar("mover")}>Mover aqui</button>
            <button className="btn-link" onClick={() => setPend(null)}>Cancelar</button>
          </div>
          {erro && <p className="tipo-erro">Não deu certo, tente de novo.</p>}
        </div>
      )}
    </C.Provider>
  );
}

export function Arrastavel({ id, tipo, nome, className, children }: { id: string; tipo: string; nome: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(C);
  return (
    <div className={`${className ?? ""} arrastavel${ctx?.arraste?.id === id ? " arrastando" : ""}`} draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "copyMove"; e.dataTransfer.setData("text/plain", id); ctx?.setArraste({ id, tipo, nome }); }}
      onDragEnd={() => setTimeout(() => ctx?.setArraste(null), 50)}>
      {children}
    </div>
  );
}

export function Soltavel({ destino, className, children }: { destino: Destino; className?: string; children: React.ReactNode }) {
  const ctx = useContext(C);
  const [sobre, setSobre] = useState(false);
  const pode = Boolean(destino.rotulo && ctx?.arraste && compativel(ctx.arraste.tipo, destino.tipo));
  return (
    <div className={`${className ?? ""}${pode ? " soltavel" : ""}${pode && sobre ? " sobre" : ""}`}
      onDragOver={(e) => { if (pode) { e.preventDefault(); e.stopPropagation(); setSobre(true); } }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => { if (!pode) return; e.preventDefault(); e.stopPropagation(); setSobre(false); ctx?.soltar(destino, e.clientX, e.clientY); }}>
      {children}
    </div>
  );
}
