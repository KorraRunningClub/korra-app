"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Botão para anexar o print/foto/PDF do comprovante de uma despesa (abre a câmera/galeria no celular).
export function AnexarComprovante({ despesaId, temComprovante }: { despesaId: string; temComprovante: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"" | "enviando" | "erro">("");
  const router = useRouter();

  async function enviar(f: File) {
    if (f.size > 10 * 1024 * 1024) {
      setEstado("erro");
      alertaTexto.current = "Arquivo maior que 10 MB.";
      return;
    }
    setEstado("enviando");
    try {
      const supabase = createClient();
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const caminho = `${despesaId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("comprovantes").upload(caminho, f, { contentType: f.type || "application/octet-stream", upsert: false });
      if (error) throw error;
      const r = await fetch("/treinador/despesas/comprovante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: despesaId, caminho }),
      });
      if (!r.ok) throw new Error(await r.text());
      setEstado("");
      router.refresh();
    } catch (e) {
      console.error(e);
      alertaTexto.current = "Não conseguimos anexar. Tente de novo.";
      setEstado("erro");
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  const alertaTexto = useRef("");

  return (
    <span className="anexar">
      <input ref={input} type="file" accept="image/*,application/pdf" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) enviar(f); }} />
      <button type="button" className="btn-link" onClick={() => input.current?.click()} disabled={estado === "enviando"}
        aria-label={temComprovante ? "Trocar comprovante" : "Anexar comprovante"}>
        {estado === "enviando" ? "Enviando…" : temComprovante ? "Trocar" : "📎 Anexar"}
      </button>
      {estado === "erro" && <span className="tipo-erro">{alertaTexto.current}</span>}
    </span>
  );
}
