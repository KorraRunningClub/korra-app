"use client";

// Botão de envio que pergunta antes ("Tem certeza?").
export function BotaoConfirmar({ texto, pergunta, className = "btn-link" }: { texto: string; pergunta: string; className?: string }) {
  return (
    <button className={className} type="submit" onClick={(e) => { if (!window.confirm(pergunta)) e.preventDefault(); }}>
      {texto}
    </button>
  );
}
