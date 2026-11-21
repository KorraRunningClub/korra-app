"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_SEG = 10.5;
const MAX_MB = 45;

async function comprimirFoto(arquivo: File): Promise<Blob> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = erro;
      i.src = url;
    });
    const lado = 1440;
    const escala = Math.min(1, lado / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * escala);
    c.height = Math.round(img.height * escala);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok) => c.toBlob((b) => ok(b!), "image/jpeg", 0.82));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function duracaoVideo(arquivo: File): Promise<number> {
  return new Promise((ok) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); ok(v.duration); };
    v.onerror = () => ok(0);
    v.src = URL.createObjectURL(arquivo);
  });
}

export function NovoPost({ userId }: { userId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legenda, setLegenda] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const video = arquivo?.type.startsWith("video/");

  async function escolher(f: File | undefined) {
    setErro(null);
    if (!f) return;
    if (f.type.startsWith("video/")) {
      if (f.size > MAX_MB * 1024 * 1024) return setErro(`O vídeo é grande demais (máx. ${MAX_MB} MB).`);
      const d = await duracaoVideo(f);
      if (d > MAX_SEG) return setErro(`O vídeo tem ${Math.round(d)} s. O limite é de 10 segundos: corte no celular e tente de novo.`);
    } else if (!f.type.startsWith("image/")) {
      return setErro("Escolha uma foto ou um vídeo.");
    }
    setArquivo(f);
    setPreview(URL.createObjectURL(f));
  }

  function limpar() {
    if (preview) URL.revokeObjectURL(preview);
    setArquivo(null); setPreview(null); setLegenda(""); setErro(null);
    if (input.current) input.current.value = "";
  }

  async function postar() {
    if (!arquivo) return;
    setEnviando(true); setErro(null);
    try {
      const supabase = createClient();
      const ehVideo = arquivo.type.startsWith("video/");
      const corpo: Blob = ehVideo ? arquivo : await comprimirFoto(arquivo);
      const ext = ehVideo ? (arquivo.type.includes("quicktime") ? "mov" : arquivo.type.includes("webm") ? "webm" : "mp4") : "jpg";
      const caminho = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("diz-ai").upload(caminho, corpo, {
        contentType: ehVideo ? arquivo.type : "image/jpeg",
        upsert: false,
      });
      if (error) throw error;
      const r = await fetch("/aluno/diz-ai/postar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caminho, tipo: ehVideo ? "video" : "foto", legenda }),
      });
      if (!r.ok) throw new Error(await r.text());
      limpar();
      router.refresh();
    } catch (e) {
      console.error(e);
      setErro("Não conseguimos postar agora. Confira sua internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="novo-post">
      {!arquivo ? (
        <button type="button" className="btn btn-primary" onClick={() => input.current?.click()}>
          + Postar foto ou vídeo
        </button>
      ) : (
        <div className="novo-post-form">
          <div className="novo-preview">
            {video ? <video src={preview!} controls playsInline muted /> : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview!} alt="Prévia" />
            )}
          </div>
          <div className="field" style={{ flex: 1, minWidth: 0 }}>
            <label htmlFor="legenda">Diz aí, como foi?</label>
            <textarea id="legenda" rows={3} maxLength={300} value={legenda} onChange={(e) => setLegenda(e.target.value)}
              placeholder="Ex.: 12 km no Coqueiros, pernas pedindo arrego no final!" />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <button type="button" className="btn btn-primary" onClick={postar} disabled={enviando}>
                {enviando ? "Postando…" : "Postar →"}
              </button>
              <button type="button" className="btn-link" onClick={limpar} disabled={enviando}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <input ref={input} type="file" accept="image/*,video/*" hidden onChange={(e) => escolher(e.target.files?.[0])} />
      {erro && <p className="msg erro" style={{ marginTop: 10 }}>{erro}</p>}
      <p className="regra" style={{ marginTop: 8 }}>
        Foto ou vídeo de até 10 segundos. Some em 24 horas. Só poste outras pessoas com a permissão delas.
      </p>
    </div>
  );
}
