import type React from "react";
import { Logo } from "@/components/Logo";
import { CATALOGO, linkPedido } from "@/lib/loja";

// Peças da loja: posição (x,y) e largura (w) em % — "d" = computador (área da seção toda), "m" = celular (área abaixo do cartão).
// a = dança, t = duração (s), atraso = começa em outro ponto da dança. Sem "m" = só aparece no computador.
const PF = "/produtos/camiseta-preta-frente.webp";
const PC = "/produtos/camiseta-preta-costas.webp";
const BF = "/produtos/camiseta-branca-frente.webp";
const BC = "/produtos/camiseta-branca-costas.webp";
const SQ = "/produtos/squeeze.webp";
type Peca = { src: string; d: [number, number, number]; m?: [number, number, number]; a: string; t: number; atraso: number; z?: number };
const PECAS: Peca[] = [
  { src: PF, d: [54, 7, 16], m: [0, 0, 44], a: "samba-a", t: 6.4, atraso: 0 },
  { src: BC, d: [76, 3, 17], m: [54, 3, 44], a: "samba-b", t: 7.3, atraso: -2 },
  { src: SQ, d: [61, 41, 22], m: [16, 40, 62], a: "samba-c", t: 5.6, atraso: -1, z: 3 },
  { src: BF, d: [53, 57, 15], m: [0, 54, 40], a: "samba-b", t: 8.1, atraso: -4 },
  { src: PC, d: [77, 54, 17], m: [56, 56, 40], a: "samba-a", t: 6.9, atraso: -3 },
  { src: SQ, d: [86, 33, 12], m: [60, 27, 34], a: "samba-d", t: 4.8, atraso: -2.5, z: 2 },
  { src: BF, d: [69, 80, 10], a: "samba-d", t: 5.2, atraso: -1.5 },
  { src: PC, d: [0.5, 2, 9], a: "samba-c", t: 7.7, atraso: -5 },
  { src: SQ, d: [38, 87, 14], a: "samba-a", t: 6.1, atraso: -0.5 },
  { src: BC, d: [46, 1, 8], a: "samba-d", t: 5.9, atraso: -3.5 },
  { src: PF, d: [90, 80, 9], a: "samba-c", t: 6.6, atraso: -2 },
  { src: SQ, d: [1, 86, 11], a: "samba-b", t: 7.0, atraso: -4.5 },
];

function estiloPeca(p: Peca) {
  const v: Record<string, string | number> = {
    "--x": `${p.d[0]}%`, "--y": `${p.d[1]}%`, "--w": `${p.d[2]}%`,
    "--a": p.a, "--t": `${p.t}s`, "--atraso": `${p.atraso}s`, zIndex: p.z ?? 1,
  };
  if (p.m) Object.assign(v, { "--xm": `${p.m[0]}%`, "--ym": `${p.m[1]}%`, "--wm": `${p.m[2]}%` });
  return v as React.CSSProperties;
}
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="inicio">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="eyebrow">Assessoria de corrida de rua</div>
              <h1>A rua antes <span className="mark">do pódio.</span></h1>
              <p className="lede">Planejamento feito para a sua rotina, um treinador que acompanha cada semana e um grupo para dividir os quilômetros com você.</p>
              <p className="where">Grande Florianópolis · presencial e online</p>
              <div className="ctas">
                <a className="btn btn-primary" href="#planos">Conheça o plano →</a>
                <a className="btn btn-ghost" href="#como-funciona">Como funciona ↓</a>
                  <a className="ja-aluno" href="/inicio">Já sou aluno → Entrar</a>
              </div>
            </div>
            <div className="hero-mark">
              <Logo />
              <div className="tag">Running Club</div>
            </div>
          </div>
        </section>

        <div className="wrap" style={{ paddingBottom: "clamp(56px,8vw,96px)" }}>
          <div className="strip">
            <a className="ph ph-foto ph-mapa" href="https://www.google.com/maps/search/?api=1&query=R.+das+Baronesas%2C+663+-+Pedra+Branca%2C+Palho%C3%A7a+-+SC" target="_blank" rel="noopener noreferrer" style={{ backgroundImage: "url(/pedra-branca.jpg)" }} aria-label="Ver Pedra Branca no Google Maps"><span className="chip-mapa">Ver no mapa ↗</span><span>Treino coletivo<br />na Pedra Branca</span></a>
            <a className="ph ph-foto ph-mapa" href="https://www.google.com/maps/search/?api=1&query=Parque+de+Coqueiros%2C+Florian%C3%B3polis+-+SC" target="_blank" rel="noopener noreferrer" style={{ backgroundImage: "url(/parque-coqueiros.jpg)" }} aria-label="Ver Parque de Coqueiros no Google Maps"><span className="chip-mapa">Ver no mapa ↗</span><span>Parque de<br />Coqueiros</span></a>
            <div className="ph ph-foto" style={{ backgroundImage: "url(/itinerante-beira-mar.jpg)" }}><span>Treino itinerante<br />pela cidade</span></div>
            <div className="ph ph-foto" style={{ backgroundImage: "url(/dia-de-prova.jpg)" }}><span>Dia de prova<br />com a equipe</span></div>
          </div>
        </div>

        <div className="road" aria-hidden="true"></div>

        <section className="band escuro" id="como-funciona">
          <div className="wrap">
            <div className="intro">
              <div>
                <div className="eyebrow">Para quem é</div>
                <h2 style={{ marginTop: "14px" }}>Começando. Voltando. <span className="soft">Buscando o próximo tempo.</span></h2>
              </div>
              <p>Não importa o seu ponto de partida. Aqui você recebe instruções diretas e objetivas para chegar onde quer, e, se ainda não tem um objetivo, a gente encontra um junto.</p>
            </div>
            <div className="steps">
              <div className="step"><span className="n">01</span><h3>A gente se conhece</h3><p>Conversa sobre sua rotina, seu histórico, suas dores e onde você quer chegar.</p></div>
              <div className="step"><span className="n">02</span><h3>Seu planejamento</h3><p>Treinos montados para a sua realidade, direto no app, semana a semana.</p></div>
              <div className="step"><span className="n">03</span><h3>Você corre</h3><p>Sozinho, de qualquer lugar, ou com o grupo nos treinos presenciais.</p></div>
              <div className="step"><span className="n">04</span><h3>Retorno e ajuste</h3><p>Seu relógio ou Strava conta como foi. A gente lê, conversa e ajusta.</p></div>
            </div>
          </div>
        </section>

        <section className="band" id="onde">
          <div className="wrap">
            <div className="loc-head">
              <div>
                <div className="eyebrow">Onde a gente treina</div>
                <h2 style={{ marginTop: "14px" }}>Um ponto fixo.<br />A cidade inteira.</h2>
              </div>
              <p style={{ opacity: ".85" }}>Base na Pedra Branca às terças e quintas. Duas terças por mês, o treino muda para o Parque de Coqueiros.</p>
            </div>
            <div className="locs">
              <article className="loc">
                <span className="kind">Ponto fixo</span>
                <h3>Pedra Branca</h3>
                <span className="city">Palhoça · SC</span>
                <p>Nossa base, na R. das Baronesas, 663. Encontro do grupo com aquecimento e treino guiado.</p>
                <div className="when">Terças e quintas · 19h30</div>
                <a className="link-mapa" href="https://www.google.com/maps/search/?api=1&query=R.+das+Baronesas%2C+663+-+Pedra+Branca%2C+Palho%C3%A7a+-+SC" target="_blank" rel="noopener noreferrer">Ver no mapa ↗</a>
              </article>
              <article className="loc">
                <span className="kind">Qualitativo</span>
                <h3>Parque de Coqueiros</h3>
                <span className="city">Florianópolis · SC</span>
                <p>Onde fazemos os treinos qualitativos: intervalados e treinos com ritmos pré-definidos.</p>
                <div className="when">2 terças por mês · 19h30</div>
                <a className="link-mapa" href="https://www.google.com/maps/search/?api=1&query=Parque+de+Coqueiros%2C+Florian%C3%B3polis+-+SC" target="_blank" rel="noopener noreferrer">Ver no mapa ↗</a>
              </article>
              <article className="loc">
                <span className="kind">Itinerante</span>
                <h3>Pela cidade</h3>
                <span className="city">Grande Florianópolis</span>
                <p>Cada vez um lugar diferente: Beira-Mar e outros percursos que a gente escolhe para sair da rotina e correr junto.</p>
                <div className="when">Datas e locais combinados no grupo</div>
              </article>
              <article className="loc escuro">
                <span className="kind">Remoto</span>
                <h3>De qualquer lugar</h3>
                <span className="city">Brasil e exterior</span>
                <p>A corrida tem esse benefício: o mesmo acompanhamento, onde você estiver.</p>
                <div className="when">Treinos no app, todos os dias</div>
              </article>
            </div>
          </div>
        </section>

        <section className="manifesto" aria-label="Manifesto">
          <div className="wrap">
            <div className="big"><span>Ser feliz</span><span>em movimento.</span></div>
            <div className="sig">Korrá Running Club</div>
          </div>
        </section>

        <section className="band escuro" id="treinador">
          <div className="wrap coach">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="coach-foto"
              src="/treinador-arthur.jpg"
              alt="Arthur Passoni Canônica correndo durante a Volta à Lagoa"
              width={900}
              height={1124}
            />
            <div>
              <div className="eyebrow">Quem treina você</div>
              <h2 style={{ marginTop: "14px" }}>Arthur Passoni Canônica</h2>
              <div className="bio">
                <p>Me chamo Arthur, sou natural de São José, na Grande Florianópolis. Nascido e criado em um ambiente de movimento, sempre estive dentro do esporte e do ambiente competitivo.</p>
                <p>Formado em Educação Física pela Universidade do Sul de Santa Catarina, atuo na corrida de rua há mais de 6 anos e já ajudei mais de 150 atletas a atingirem objetivos diversos na modalidade.</p>
                <p>Competições em pista, longas distâncias, primeiros metros. Minha missão é entregar o máximo de qualidade de treinamento e informação para que o seu objetivo seja concluído com êxito e segurança.</p>
                <p>Da Meia Maratona ao staff do Fodax-Man Solo Point Five, a corrida me move.</p>
              </div>
              <div className="stats">
                <div className="stat"><b>+6</b><small>anos na corrida de rua</small></div>
                <div className="stat"><b>+150</b><small>atletas acompanhados</small></div>
                <div className="stat"><b style={{ fontSize: "clamp(20px,2.4vw,26px)", paddingTop: "8px" }}>035416-G/SC</b><small>CREF</small></div>
              </div>
              <p className="quote">“O objetivo é um só: ser feliz em movimento.”</p>
            </div>
          </div>
        </section>

        <section className="band" id="planos">
          <div className="wrap plans">
            <div>
              <div className="eyebrow">Plano</div>
              <h2 style={{ marginTop: "14px" }}>Um plano.<br />Tudo incluído.</h2>
              <p style={{ marginTop: "22px", opacity: ".9" }}>Planejamento individual não é diferencial aqui. É o mínimo que uma assessoria esportiva deve entregar. Você paga um valor só e treina presencial, online ou os dois.</p>
              <div className="pay" aria-label="Formas de pagamento">
                <span>Pix</span><span>Cartão de crédito</span><span>Cobrança automática mensal</span>
              </div>
            </div>
            <div className="card escuro">
              <div className="top">
                <span className="name">Mensal</span>
                <span className="name" style={{ opacity: ".7" }}>Presencial + online</span>
              </div>
              <div className="price"><span className="cur">R$</span><span className="val">165</span><span className="per">/mês</span></div>
              <ul>
                <li>Planejamento individual no app de treinos</li>
                <li>Treinos coletivos na Pedra Branca e pela ilha</li>
                <li>Contato direto com o treinador</li>
                <li>Leitura dos treinos pelo seu relógio ou Strava</li>
                <li className="soon">Em breve: rankings, comunidade e conteúdos na área do aluno</li>
              </ul>
              <a className="btn btn-primary" href="https://wa.me/5548985001468?text=Ol%C3%A1%21%20Quero%20conhecer%20a%20Korr%C3%A1%20Running%20Club." target="_blank" rel="noopener noreferrer">Quero começar →</a>
              <p className="note">Matrícula pelo WhatsApp (48) 98500-1468. Planos trimestral e anual em breve.</p>
            </div>
          </div>
        </section>

        <section className="loja" id="loja" aria-label="Produtos oficiais Korrá">
          <div className="loja-palco" aria-label="Camisetas oficiais preta e branca, frente e costas, e squeezes da Korrá dançando">
            {PECAS.map((p, i) => (
              <div key={i} className={`peca${p.m ? "" : " so-pc"}`} style={estiloPeca(p)}>
                <img src={p.src} alt="" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
          <div className="wrap loja-grid">
            <div className="loja-texto loja-cartao escuro">
              <div className="eyebrow">Produtos oficiais</div>
              <h2 style={{ marginTop: "14px" }}>Veste a Korrá.</h2>
              <p className="loja-lede">
                Camiseta e squeeze oficiais pra treinar, competir e mostrar de onde você vem. Escolha a peça ou monte o seu kit.
              </p>
              <ul className="catalogo">
                {CATALOGO.map((item) => {
                  const [inteiro, cent] = item.preco.toFixed(2).split(".");
                  return (
                    <li key={item.id} className={`produto${item.destaque ? " destaque" : ""}`}>
                      <div style={{ minWidth: 0 }}>
                        <span className="produto-nome">{item.nome}</span>
                        <span className="produto-det">{item.detalhe}</span>
                      </div>
                      <div className="produto-lado">
                        <div className="preco"><span className="cur">R$</span><span className="val">{inteiro}</span><span className="cent">,{cent}</span></div>
                        <a className="pedir" href={linkPedido(item.id)}>Pedir →</a>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="loja-nota" style={{ marginTop: 14 }}>Pedidos pelo WhatsApp (48) 98500-1468.</p>
            </div>
          </div>
        </section>
        <section className="band escuro" id="duvidas">
          <div className="wrap faq">
            <div>
              <div className="eyebrow">Dúvidas</div>
              <h2 style={{ marginTop: "14px" }}>Antes da largada.</h2>
            </div>
            <div>
              <details open>
                <summary>O planejamento é individualizado?</summary>
                <p>Sim! Mas aqui não vendemos isso como diferencial. Acreditamos que entregar um planejamento direcionado à sua realidade é o mínimo de uma assessoria esportiva.</p>
              </details>
              <details>
                <summary>Preciso saber correr?</summary>
                <p>Não precisa. Aqui você recebe instruções diretas e objetivas para alcançar seus objetivos, ou até mesmo criá-los, caso ainda não tenha.</p>
              </details>
              <details>
                <summary>Preciso ir aos encontros presenciais?</summary>
                <p>Não. A corrida tem esse benefício: dá para correr de qualquer lugar. Mas saiba que ter um grupo correndo com você ajuda muito no seu desenvolvimento.</p>
              </details>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
