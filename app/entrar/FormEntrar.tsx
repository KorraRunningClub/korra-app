"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FormEntrar() {
  const router = useRouter();
  const params = useSearchParams();
  const voltar = params.get("voltar") || "/aluno";
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(voltar)}`,
      },
    });
    setEnviando(false);
    if (error) {
      setErro(
        error.status === 429
          ? "Muitas tentativas seguidas. Espere alguns minutos e tente de novo."
          : "Não conseguimos enviar o código. Confira o e-mail e tente de novo.",
      );
      return;
    }
    setEtapa("codigo");
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: codigo.trim(),
      type: "email",
    });
    setEnviando(false);
    if (error) {
      setErro("Código inválido ou vencido. Peça um novo código e tente de novo.");
      return;
    }
    router.replace(voltar);
    router.refresh();
  }

  if (etapa === "email") {
    return (
      <form className="panel" onSubmit={enviarCodigo}>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </div>
        {erro && <p className="msg erro">{erro}</p>}
        <button className="btn btn-primary" type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Receber código →"}
        </button>
      </form>
    );
  }

  return (
    <form className="panel" onSubmit={confirmarCodigo}>
      <p className="msg">
        Enviamos um código para <strong>{email}</strong>. Confira também a caixa de spam.
      </p>
      <div className="field">
        <label htmlFor="codigo">Código</label>
        <input
          id="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,8}"
          required
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="000000"
        />
      </div>
      {erro && <p className="msg erro">{erro}</p>}
      <button className="btn btn-primary" type="submit" disabled={enviando}>
        {enviando ? "Conferindo…" : "Entrar →"}
      </button>
      <button type="button" className="btn-link" onClick={() => setEtapa("email")}>
        Usar outro e-mail
      </button>
    </form>
  );
}
