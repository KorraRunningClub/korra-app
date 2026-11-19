import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="escuro">
      <div className="wrap">
        <div className="foot">
          <div>
            <Logo />
            <p className="tag">Assessoria de corrida de rua. Grande Florianópolis e acompanhamento online.</p>
          </div>
          <div>
            <h4>Navegue</h4>
            <ul>
              <li><a href="/#como-funciona">Como funciona</a></li>
              <li><a href="/#onde">Onde treinamos</a></li>
              <li><a href="/#treinador">Treinador</a></li>
              <li><a href="/#planos">Planos</a></li>
            </ul>
          </div>
          <div>
            <h4>Contato</h4>
            <ul>
              <li><a href="https://wa.me/5548985001468?text=Ol%C3%A1%21%20Quero%20conhecer%20a%20Korr%C3%A1%20Running%20Club." target="_blank" rel="noopener noreferrer">WhatsApp (48) 98500-1468</a></li>
              <li><a href="https://instagram.com/korrarunning" target="_blank" rel="noopener noreferrer">@korrarunning</a></li>
              <li><a href="https://instagram.com/arthur_dakorra" target="_blank" rel="noopener noreferrer">@arthur_dakorra</a> <span style={{ opacity: ".6" }}>(treinador)</span></li>
              <li>korrarunningclub.com.br</li>
            </ul>
          </div>
          <div>
            <h4>Alunos</h4>
            <ul>
              <li><Link href="/entrar">Área do aluno</Link></li>
              <li>Rankings <span style={{ opacity: ".6" }}>(em breve)</span></li>
              <li>Diz Aí Como Foi <span style={{ opacity: ".6" }}>(em breve)</span></li>
            </ul>
          </div>
        </div>
        <div className="legal"><span>© {new Date().getFullYear()} Korrá Running Club</span><span>Arthur Passoni Canônica · CREF 035416-G/SC</span></div>
      </div>
    </footer>
  );
}
