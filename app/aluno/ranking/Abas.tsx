"use client";

import { useState } from "react";

export type LinhaRanking = { id: string; nome: string; valor: string; eu: boolean };
export type Board = { chave: string; aba: string; titulo: string; regra: string; linhas: LinhaRanking[] };

function Podio({ linhas }: { linhas: LinhaRanking[] }) {
  // ordem visual: 2º, 1º, 3º
  const ordem = [1, 0, 2].map((i) => ({ l: linhas[i], pos: i + 1 })).filter((x) => x.l);
  return (
    <div className="podio">
      {ordem.map(({ l, pos }) => (
        <div key={l.id} className={`degrau degrau-${pos}${l.eu ? " eu" : ""}`}>
          <span className="medalha" aria-label={`${pos}º lugar`}>{pos}</span>
          <span className="podio-nome">{l.nome}{l.eu ? " (você)" : ""}</span>
          <span className="podio-valor">{l.valor}</span>
          <span className="bloco" aria-hidden="true">{pos}º</span>
        </div>
      ))}
    </div>
  );
}

export function AbasRanking({ boards }: { boards: Board[] }) {
  const [ativa, setAtiva] = useState(boards[0]?.chave);
  const b = boards.find((x) => x.chave === ativa) ?? boards[0];

  return (
    <div className="ranking-abas">
      <div className="abas" role="tablist" aria-label="Rankings">
        {boards.map((x) => (
          <button
            key={x.chave}
            role="tab"
            type="button"
            aria-selected={x.chave === b.chave}
            className={`aba${x.chave === b.chave ? " ativa" : ""}`}
            onClick={() => setAtiva(x.chave)}
          >
            <span className="aba-nome">{x.aba}</span>
            <span className="aba-lider">{x.linhas[0] ? `${x.linhas[0].nome} · ${x.linhas[0].valor}` : "ninguém ainda"}</span>
          </button>
        ))}
      </div>

      <section key={b.chave} className="painel-ranking" role="tabpanel">
        <div className="painel-topo">
          <h3>{b.titulo}</h3>
          <p className="regra">{b.regra}</p>
        </div>
        {b.linhas.length === 0 ? (
          <p className="vazio">Ninguém pontuou ainda. Bora inaugurar?</p>
        ) : (
          <>
            <Podio linhas={b.linhas.slice(0, 3)} />
            {b.linhas.length > 3 && (
              <ol className="lista-ranking" start={4}>
                {b.linhas.slice(3, 15).map((l, i) => (
                  <li key={l.id} className={l.eu ? "eu" : undefined}>
                    <span className="pos">{i + 4}</span>
                    <span className="quem">{l.nome}{l.eu ? " (você)" : ""}</span>
                    <span className="valor">{l.valor}</span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </section>
    </div>
  );
}
