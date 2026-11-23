"use client";

import { useState } from "react";
import { CATALOGO, CORES, ESTILOS, NOME_ESTILO, PECAS_DO_ITEM, PIX_CHAVE, TAMANHOS, reais } from "@/lib/loja";

export function FormPedido({ itemInicial, nome, telefone }: { itemInicial: string; nome: string; telefone: string }) {
  const [itemId, setItemId] = useState(itemInicial);
  const [qtd, setQtd] = useState(1);
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
  let nCamiseta = 0;
  let nSqueeze = 0;

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
          return (
            <div key={i} className="peca-escolha">
              <b>Squeeze {pecas.filter((p) => p === "squeeze").length > 1 ? nSqueeze : ""}</b>
              <span className="regra">Modelo único</span>
              <input type="hidden" name={`p${i}_tipo`} value="squeeze" />
            </div>
          );
        }
        nCamiseta++;
        return (
          <fieldset key={i} className="peca-escolha">
            <legend>Camiseta {pecas.filter((p) => p === "camiseta").length > 1 ? nCamiseta : ""}</legend>
            <input type="hidden" name={`p${i}_tipo`} value="camiseta" />
            <div className="linha-campos">
              <div className="field"><label htmlFor={`p${i}s`}>Estilo</label>
                <select id={`p${i}s`} name={`p${i}_estilo`} required defaultValue="">{[<option key="" value="" disabled>Escolha</option>, ...ESTILOS.map((c) => <option key={c} value={c}>{NOME_ESTILO[c]}</option>)]}</select></div>
              <div className="field"><label htmlFor={`p${i}c`}>Cor</label>
                <select id={`p${i}c`} name={`p${i}_cor`} required defaultValue="">{[<option key="" value="" disabled>Escolha</option>, ...CORES.map((c) => <option key={c}>{c}</option>)]}</select></div>
              <div className="field"><label htmlFor={`p${i}t`}>Tamanho</label>
                <select id={`p${i}t`} name={`p${i}_tamanho`} required defaultValue="">{[<option key="" value="" disabled>Escolha</option>, ...TAMANHOS.map((c) => <option key={c}>{c}</option>)]}</select></div>
            </div>
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
      <button className="btn btn-primary" type="submit">Enviar pedido pelo WhatsApp →</button>
      <p className="regra"><b>Pagamento somente via Pix</b>, na chave acima (Arthur Canônica). Depois de enviar o pedido, mande o comprovante na mesma conversa do WhatsApp. O pedido é confirmado quando o Arthur recebe o comprovante, e a entrega é combinada por lá.</p>
    </form>
  );
}
