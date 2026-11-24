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
          {treinador ? (
            <li className="tem-sub">
              <Link className="sub-rotulo" href="/aluno" aria-haspopup="true">Minha área ▾</Link>
              <ul className="submenu">
                <li><Link href="/aluno"><b>Minha área</b><span>Seus dados e atalhos</span></Link></li>
                <li><Link href="/treinador/agenda"><b><i className="so-pc">Minha </i>Agenda</b><span>Seus horários de personal e treinos (só você vê)</span></Link></li>
              </ul>
            </li>
          ) : (
            <li><Link href="/aluno">Minha área</Link></li>
          )}
          <li className="tem-sub">
            <Link className="sub-rotulo" href="/aluno/ranking" aria-haspopup="true">Ranking ▾</Link>
            <ul className="submenu">
              <li><Link href="/aluno/ranking"><b>Ranking</b><span>Quadros da semana, do mês e do semestre</span></Link></li>
              <li><Link href="/aluno/conquistas"><b>Conquistas<i className="so-pc"> disponíveis</i></b><span>Medalhas para desbloquear</span></Link></li>
            </ul>
          </li>
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
