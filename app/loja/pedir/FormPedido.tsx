"use client";

import { useState } from "react";
import { CATALOGO, CORES, ESTILOS, NOME_ESTILO, PECAS_DO_ITEM, PIX_CHAVE, TAMANHOS, nomeCamiseta, reais } from "@/lib/loja";

type Escolha = { estilo: string; cor: string; tamanho: string };
const vazia: Escolha = { estilo: "", cor: "", tamanho: "" };

export function FormPedido({
  itemInicial, nome, telefone, disp,
}: { itemInicial: string; nome: string; telefone: string; disp: Record<string, number> | null }) {
  const [itemId, setItemId] = useState(itemInicial);
  const [qtd, setQtd] = useState(1);
  const [escolhas, setEscolhas] = useState<Escolha[]>([]);
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(PIX_CHAVE);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };

  const item = CATALOGO.find((c) => c.id === itemId) ?? CATALOGO[0];
  const pecas = Array.from({ length: qtd }, () => PECAS_DO_ITEM[item.id] ?? []).flat();
  const esc = (i: number) => escolhas[i] ?? vazia;
  const mudar = (i: number, campo: keyof Escolha, valor: string) =>
    setEscolhas((atual) => {
      const novo = [...atual];
      novo[i] = { ...(novo[i] ?? vazia), [campo]: valor };
      return novo;
    });

  // quanto sobra de cada peça, descontando o que já foi escolhido nas outras linhas deste pedido
  const sobra = (nomeItem: string, ignorar: number) => {
    if (!disp) return Infinity;
    let n = disp[nomeItem] ?? 0;
    pecas.forEach((tipo, j) => {
      if (j === ignorar) return;
      if (tipo === "squeeze" && nomeItem === "Squeeze Korrá") n--;
      const e = esc(j);
      if (tipo === "camiseta" && e.estilo && e.cor && e.tamanho && nomeCamiseta(e.cor, e.estilo, e.tamanho) === nomeItem) n--;
    });
    return n;
  };
  const squeezeFalta = pecas.some((t, i) => t === "squeeze" && sobra("Squeeze Korrá", i) <= 0);
  const camisetaFalta = pecas.some((t, i) => {
    const e = esc(i);
    return t === "camiseta" && e.estilo && e.cor && e.tamanho && sobra(nomeCamiseta(e.cor, e.estilo, e.tamanho), i) <= 0;
  });
  const bloqueado = squeezeFalta || camisetaFalta;
  let nCamiseta = 0;
  let nSqueeze = 0;
  const totCam = pecas.filter((p) => p === "camiseta").length;
  const totSq = pecas.filter((p) => p === "squeeze").length;

  return (
    <form className="panel pedido-form" action="/loja/pedido" method="post">
      <div className="field">
        <label htmlFor="p-item">Produto</label>
        <select id="p-item" name="item" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {CATALOGO.map((c) => <option key={c.id} value={c.id}>{c.nome} · {reais(c.preco)}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="p-qtd">Quantidade</label>
        <select id="p-qtd" name="qtd" value={qtd} onChange={(e) => setQtd(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {pecas.map((tipo, i) => {
        if (tipo === "squeeze") {
          nSqueeze++;
          const resta = sobra("Squeeze Korrá", i);
          return (
            <div key={i} className={`peca-escolha${resta <= 0 ? " sem" : ""}`}>
              <b>Squeeze {totSq > 1 ? nSqueeze : ""}</b>
              <span className={resta <= 0 ? "aviso-esgotado" : "regra"}>{resta <= 0 ? "Esgotado no momento" : "Modelo único · disponível"}</span>
              <input type="hidden" name={`p${i}_tipo`} value="squeeze" />
            </div>
          );
        }
        nCamiseta++;
        const e = esc(i);
        const pronto = e.estilo && e.cor;
        const restaTam = (t: string) => (pronto ? sobra(nomeCamiseta(e.cor, e.estilo, t), i) : Infinity);
        const escolhida = pronto && e.tamanho ? restaTam(e.tamanho) : Infinity;
        return (
          <fieldset key={i} className={`peca-escolha${escolhida <= 0 ? " sem" : ""}`}>
            <legend>Camiseta {totCam > 1 ? nCamiseta : ""}</legend>
            <input type="hidden" name={`p${i}_tipo`} value="camiseta" />
            <div className="linha-campos">
              <div className="field"><label htmlFor={`p${i}s`}>Estilo</label>
                <select id={`p${i}s`} name={`p${i}_estilo`} required value={e.estilo} onChange={(ev) => mudar(i, "estilo", ev.target.value)}>
                  <option value="" disabled>Escolha</option>
                  {ESTILOS.map((c) => <option key={c} value={c}>{NOME_ESTILO[c]}</option>)}
                </select></div>
              <div className="field"><label htmlFor={`p${i}c`}>Cor</label>
                <select id={`p${i}c`} name={`p${i}_cor`} required value={e.cor} onChange={(ev) => mudar(i, "cor", ev.target.value)}>
                  <option value="" disabled>Escolha</option>
                  {CORES.map((c) => <option key={c}>{c}</option>)}
                </select></div>
              <div className="field"><label htmlFor={`p${i}t`}>Tamanho</label>
                <select id={`p${i}t`} name={`p${i}_tamanho`} required value={e.tamanho} onChange={(ev) => mudar(i, "tamanho", ev.target.value)}>
                  <option value="" disabled>{pronto ? "Escolha" : "Escolha estilo e cor"}</option>
                  {TAMANHOS.map((t) => {
                    const r = restaTam(t);
                    return <option key={t} value={t} disabled={r <= 0}>{t}{r <= 0 ? " · esgotado" : r <= 2 ? ` · últimas ${r}` : ""}</option>;
                  })}
                </select></div>
            </div>
            {escolhida <= 0 && <span className="aviso-esgotado">Esse tamanho esgotou. Escolha outro.</span>}
          </fieldset>
        );
      })}

      <div className="field"><label htmlFor="p-nome">Seu nome</label><input id="p-nome" name="nome" required maxLength={80} defaultValue={nome} /></div>
      <div className="field"><label htmlFor="p-tel">WhatsApp (opcional)</label><input id="p-tel" name="telefone" inputMode="tel" maxLength={20} defaultValue={telefone} placeholder="(48) 9...." /></div>
      <div className="field"><label htmlFor="p-obs">Observação (opcional)</label><input id="p-obs" name="obs" maxLength={200} placeholder="Ex.: retiro no treino de quinta" /></div>

      <div className="pedido-total">
        <span>Total</span>
        <b>{reais(item.preco * qtd)}</b>
      </div>
      <div className="pix-box">
        <span className="pix-rot">Chave Pix (e-mail)</span>
        <span className="pix-chave">{PIX_CHAVE}</span>
        <button type="button" className="btn-link" onClick={copiar}>{copiado ? "Copiada!" : "Copiar chave"}</button>
      </div>
      {bloqueado && <p className="aviso-esgotado">Alguma peça do pedido está esgotada. Troque o tamanho ou o produto, ou chame o Arthur no WhatsApp (48) 98500-1468 para encomendar.</p>}
      <button className="btn btn-primary" type="submit" disabled={bloqueado}>Enviar pedido pelo WhatsApp →</button>
      <p className="regra"><b>Pagamento somente via Pix</b>, na chave acima (Arthur Canônica). Depois de enviar o pedido, mande o comprovante na mesma conversa do WhatsApp. O pedido é confirmado quando o Arthur recebe o comprovante, e a entrega é combinada por lá.</p>
    </form>
  );
}
