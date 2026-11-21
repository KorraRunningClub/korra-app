import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header>
      <div className="wrap nav">
        <a className="brand" href="/#inicio" aria-label="Korrá Running Club, início">
          <Logo decorative />
        </a>
        <ul>
          <li><a href="/#como-funciona">Como funciona</a></li>
          <li><a href="/#onde">Onde treinamos</a></li>
          <li><a href="/#treinador">Treinador</a></li>
          <li><a href="/#planos">Planos</a></li>
          <li><a href="/#duvidas">Dúvidas</a></li>
        </ul>
        <div className="nav-cta">
          <Link className="aluno" href="/inicio">Área do aluno</Link>
          <a className="btn btn-primary" href="/#planos">Quero treinar</a>
        </div>
      </div>
    </header>
  );
}
