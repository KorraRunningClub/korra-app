import Link from "next/link";
import { Logo } from "./Logo";

export function AppHeader({ nome, treinador }: { nome?: string | null; treinador?: boolean }) {
  return (
    <header>
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label="Korrá Running Club, início">
          <Logo decorative />
        </Link>
        <ul>
          <li><Link href="/aluno">Minha área</Link></li>
          <li><Link href="/aluno/ranking">Ranking</Link></li>
          {treinador && <li><Link href="/treinador">Painel do treinador</Link></li>}
        </ul>
        <div className="nav-cta">
          {nome && <span className="aluno">{nome}</span>}
          <form action="/sair" method="post">
            <button className="btn btn-ghost" type="submit">Sair</button>
          </form>
        </div>
      </div>
    </header>
  );
}
