import Link from "next/link";
import { Logo } from "./Logo";

export function AppHeader({ nome, treinador }: { nome?: string | null; treinador?: boolean }) {
  return (
    <header className="app-header">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label="Korrá Running Club, início">
          <Logo decorative />
        </Link>
        <ul>
          <li><Link href="/aluno">Minha área</Link></li>
          <li><Link href="/aluno/ranking">Ranking</Link></li>
          <li className="tem-sub">
            <Link className="sub-rotulo" href="/aluno/calendario" aria-haspopup="true">Calendário ▾</Link>
            <ul className="submenu">
              <li><Link href="/aluno/calendario"><b>Calendário<i className="so-pc"> da assessoria</i></b><span>Treinos, encontros e provas oficiais</span></Link></li>
              <li><Link href="/aluno/provas"><b>Provas</b><span>As suas provas e as da turma</span></Link></li>
            </ul>
          </li>
          <li><Link href="/aluno/diz-ai">Diz Aí</Link></li>
          <li><Link href="/aluno/forum">Fórum</Link></li>
          {treinador && <li><Link href="/treinador">Painel</Link></li>}
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
