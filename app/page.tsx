import { Logo } from "@/components/Logo";
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
            <div className="ph"><span>Treino coletivo<br />na Pedra Branca</span></div>
            <div className="ph"><span>Sábado no Parque<br />de Coqueiros</span></div>
            <div className="ph"><span>Treino itinerante<br />pela cidade</span></div>
            <div className="ph"><span>Dia de prova<br />com a equipe</span></div>
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
              </article>
              <article className="loc">
                <span className="kind">Qualitativo</span>
                <h3>Parque de Coqueiros</h3>
                <span className="city">Florianópolis · SC</span>
                <p>Onde fazemos os treinos qualitativos: intervalados e treinos com ritmos pré-definidos.</p>
                <div className="when">2 terças por mês · 19h30</div>
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

        <section className="band closing">
          <div className="wrap">
            <div className="eyebrow">Bora?</div>
            <h2 style={{ marginTop: "14px" }}>A rua antes<br />do pódio.</h2>
            <div className="ctas">
              <a className="btn btn-primary" href="https://wa.me/5548985001468?text=Ol%C3%A1%21%20Quero%20conhecer%20a%20Korr%C3%A1%20Running%20Club." target="_blank" rel="noopener noreferrer">Chamar no WhatsApp →</a>
              <span style={{ alignSelf: "center", fontFamily: "var(--f-label)", letterSpacing: ".06em", fontSize: "18px" }}>(48) 98500-1468</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
