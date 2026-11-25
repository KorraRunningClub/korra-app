"use client";

import { useState } from "react";
import { FASES_TREINO, NIVEIS, SUBTIPOS, TIPOS, UNIDADES, descansoTxt, seriesDo, type Bloco, type Serie, type TreinoModelo } from "@/lib/biblioteca";
import { ZONAS_VDOT } from "@/lib/zonas";

function CampoBloco({ prefixo, rotulo, bloco, unidades, zonaPadrao, opcional }: {
  prefixo: string; rotulo: string; bloco?: Bloco | null; unidades: (keyof typeof UNIDADES)[]; zonaPadrao: number; opcional?: boolean;
}) {
  return (
    <fieldset className="bloco-treino">
      <legend>{rotulo}{opcional && <span className="regra"> (opcional)</span>}</legend>
      <div className="linha-campos" style={{ gridTemplateColumns: "1fr 1fr 2fr" }}>
        <div className="field"><label htmlFor={`${prefixo}_valor`}>Quanto</label>
          <input id={`${prefixo}_valor`} name={`${prefixo}_valor`} inputMode="decimal" required={!opcional} defaultValue={bloco ? String(bloco.valor).replace(".", ",") : ""} placeholder="ex.: 15" />
        </div>
        <div className="field"><label htmlFor={`${prefixo}_unidade`}>Unidade</label>
          <select id={`${prefixo}_unidade`} name={`${prefixo}_unidade`} defaultValue={bloco?.unidade ?? unidades[0]}>
            {unidades.map((u) => <option key={u} value={u}>{UNIDADES[u]}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor={`${prefixo}_zona`}>Zona</label>
          <select id={`${prefixo}_zona`} name={`${prefixo}_zona`} defaultValue={bloco?.zona ?? zonaPadrao}>
            {ZONAS_VDOT.map((z) => <option key={z.n} value={z.n}>Z{z.n} · {z.nome}</option>)}
          </select>
        </div>
      </div>
    </fieldset>
  );
}

// Formulário da biblioteca: o tipo escolhido define quais blocos aparecem.
export function FormTreino({ treino, fase, atleta, voltar, tipoInicial, subtipoInicial }: { treino: TreinoModelo | null; fase: string; atleta?: string; voltar: string; tipoInicial?: string; subtipoInicial?: string }) {
  const [tipo, setTipo] = useState<string>(treino?.tipo ?? tipoInicial ?? "intervalado");
  const e = treino?.estrutura ?? {};
  const intervalado = tipo === "intervalado";
  const zonaPrincipal = tipo === "regenerativo" ? 1 : 2;
  const iniciais = seriesDo(e);
  const [series, setSeries] = useState<(Partial<Serie> & { chave: number })[]>(
    (iniciais.length ? iniciais : [{ series: 4, valor: 0, unidade: "min", zona: 4 } as Serie]).map((x, i) => ({ ...x, chave: i })),
  );
  const tempo = (x?: number | null) => (x ? `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}` : "");
  return (
    <form action="/treinador/treinos/acao" method="post" className="evento-form">
      <input type="hidden" name="acao" value={treino ? "editar" : "criar"} />
      {treino && <input type="hidden" name="id" value={treino.id} />}
      {atleta && <input type="hidden" name="atleta" value={atleta} />}
      <div className="linha-campos" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="field"><label htmlFor="b-tipo">Tipo</label>
          <select id="b-tipo" name="tipo" value={tipo} onChange={(ev) => setTipo(ev.target.value)}>
            {Object.entries(TIPOS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="b-fase">Fase</label>
          <select id="b-fase" name="fase" defaultValue={treino?.fase ?? fase}>{Object.entries(FASES_TREINO).map(([k, f]) => <option key={k} value={k}>{f.nome}</option>)}</select>
        </div>
        <div className="field"><label htmlFor="b-nivel">Nível</label>
          <select id="b-nivel" name="nivel" defaultValue={treino?.nivel ?? "iniciante"}>{Object.entries(NIVEIS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        </div>
      </div>
      {intervalado && (
        <div className="field"><label htmlFor="b-sub">Modelo de intervalado</label>
          <select id="b-sub" name="subtipo" defaultValue={treino?.subtipo ?? subtipoInicial ?? "limiar_fracionado"}>{Object.entries(SUBTIPOS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        </div>
      )}
      <div className="field"><label htmlFor="b-nome">Nome (opcional)</label>
        <input id="b-nome" name="nome" maxLength={80} defaultValue={treino?.nome ?? ""} placeholder={intervalado ? "Se ficar vazio, usa o modelo (ex.: Limiar fracionado)" : "Se ficar vazio, usa o tipo (ex.: Rodagem)"} />
      </div>

      {!intervalado ? (
        <CampoBloco prefixo="principal" rotulo={TIPOS[tipo as keyof typeof TIPOS]} bloco={e.principal} unidades={["km", "min"]} zonaPadrao={zonaPrincipal} />
      ) : (
        <>
          <CampoBloco prefixo="aquecimento" rotulo="1. Aquecimento" bloco={e.aquecimento} unidades={["min", "km"]} zonaPadrao={2} />
          <CampoBloco prefixo="strides" rotulo="2. Strides" bloco={e.strides} unidades={["m", "s", "km", "min"]} zonaPadrao={6} opcional />
          <div className="field"><label htmlFor="b-ds">3. Descanso depois dos strides (tempo, ex.: 2:00)</label>
            <input id="b-ds" name="descanso_strides" defaultValue={e.descanso_strides_s ? descansoTxt(e.descanso_strides_s).replace(" min", ":00") : ""} placeholder="ex.: 2:00" />
          </div>
          <input type="hidden" name="n_series" value={series.length} />
          {series.map((sr, i) => (
            <fieldset key={sr.chave} className="bloco-treino serie-bloco">
              <legend>4.{i + 1} Série principal{series.length > 1 ? ` ${i + 1}` : ""}</legend>
              <div className="linha-campos" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr" }}>
                <div className="field"><label htmlFor={`s${i}-n`}>Repetições</label><input id={`s${i}-n`} name={`s${i}_series`} type="number" min={1} max={60} required defaultValue={sr.series ?? 4} /></div>
                <div className="field"><label htmlFor={`s${i}-x`}>até (opcional)</label><input id={`s${i}-x`} name={`s${i}_series_max`} type="number" min={1} max={60} defaultValue={sr.series_max ?? ""} /></div>
                <div className="field"><label htmlFor={`s${i}-v`}>Cada uma</label><input id={`s${i}-v`} name={`s${i}_valor`} inputMode="decimal" required defaultValue={sr.valor ? String(sr.valor).replace(".", ",") : ""} placeholder="ex.: 400" /></div>
                <div className="field"><label htmlFor={`s${i}-u`}>Unidade</label>
                  <select id={`s${i}-u`} name={`s${i}_unidade`} defaultValue={sr.unidade ?? "min"}>{(["min", "s", "m", "km"] as const).map((u) => <option key={u} value={u}>{UNIDADES[u]}</option>)}</select>
                </div>
                <div className="field"><label htmlFor={`s${i}-z`}>Zona</label>
                  <select id={`s${i}-z`} name={`s${i}_zona`} defaultValue={sr.zona ?? 4}>{ZONAS_VDOT.map((z) => <option key={z.n} value={z.n}>Z{z.n} · {z.nome}</option>)}</select>
                </div>
              </div>
              <div className="linha-campos" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field"><label htmlFor={`s${i}-d`}>Descanso entre as repetições (ex.: 1:00 ou 1:00 a 1:20)</label>
                  <input id={`s${i}-d`} name={`s${i}_descanso`} defaultValue={[sr.descanso_s, sr.descanso_max_s].filter(Boolean).map((x) => tempo(x)).join(" a ")} placeholder="ex.: 1:00" />
                </div>
                {i < series.length - 1 ? (
                  <div className="field"><label htmlFor={`s${i}-dd`}>Descanso antes da próxima série</label>
                    <input id={`s${i}-dd`} name={`s${i}_descanso_depois`} defaultValue={tempo(sr.descanso_depois_s)} placeholder="ex.: 3:00" />
                  </div>
                ) : <div />}
              </div>
              {series.length > 1 && (
                <button type="button" className="btn-link" onClick={() => setSeries((a) => a.filter((x) => x.chave !== sr.chave))}>Remover esta série</button>
              )}
            </fieldset>
          ))}
          <button type="button" className="btn btn-ghost add-serie"
            onClick={() => setSeries((a) => [...a, { chave: Math.max(...a.map((x) => x.chave)) + 1, series: 4, unidade: "m", zona: 5 }])}>
            + Adicionar série
          </button>
          <CampoBloco prefixo="volta_calma" rotulo="5. Volta à calma" bloco={e.volta_calma} unidades={["min", "km"]} zonaPadrao={1} />
        </>
      )}
      <div className="field"><label htmlFor="b-obs">Observações</label><textarea id="b-obs" name="obs" rows={2} maxLength={500} defaultValue={treino?.obs ?? ""} /></div>
      <div className="evento-form-acoes">
        <button className="btn btn-primary" type="submit">{treino ? "Salvar" : "Adicionar à biblioteca"}</button>
        <a className="btn-link" href={voltar}>Cancelar</a>
      </div>
    </form>
  );
}
