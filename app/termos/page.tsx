import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Termos de Uso · Korrá Running Club" };

export default function TermosPage() {
  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <article className="wrap doc-legal">
          <div className="eyebrow">Regras do app</div>
          <h1>Termos de Uso</h1>
          <p className="atualizado">Última atualização: 20 de novembro de 2026</p>

          <h2>1. O que é</h2>
          <p>
            O site e a área do aluno da Korrá Running Club são oferecidos por Arthur Passoni Canônica
            (CREF 035416-G/SC) aos alunos da assessoria. Ao criar sua conta, você concorda com estes termos e com a{" "}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </p>

          <h2>2. Conta</h2>
          <ul>
            <li>A conta é pessoal. Use um e-mail seu e não compartilhe os links ou códigos de acesso.</li>
            <li>Mantenha seu cadastro correto e atualizado.</li>
            <li>Menores de 18 anos só podem usar com autorização do responsável legal.</li>
            <li>O acesso completo é liberado com a matrícula ativa e pode ser pausado em caso de mensalidade em atraso.</li>
          </ul>

          <h2>3. Ranking e desafios</h2>
          <ul>
            <li>Participar é opcional. Você pode se esconder do ranking ou desconectar o Strava quando quiser.</li>
            <li>Valem corridas reais e próprias. Treinos manipulados podem ser removidos pelo treinador.</li>
            <li>Rankings e medalhas são uma brincadeira saudável entre alunos e não substituem a orientação do treinador.</li>
          </ul>

          <h2>4. Saúde e segurança</h2>
          <p>
            A corrida envolve esforço físico. Recomendamos avaliação médica antes de começar ou aumentar a intensidade
            dos treinos e que você respeite seus limites. Os desafios do app não são um incentivo para treinar além
            do que foi planejado para você.
          </p>

          <h2>5. Conteúdos</h2>
          <p>
            Textos, vídeos, marca e imagens da Korrá pertencem à assessoria ou a seus parceiros e não podem ser
            copiados para fins comerciais sem autorização.
          </p>

          <h2>6. Encerramento</h2>
          <p>
            Você pode excluir sua conta a qualquer momento em <Link href="/aluno/cadastro">Meus dados</Link>.
            A assessoria pode suspender contas que desrespeitem estes termos.
          </p>

          <h2>7. Contato</h2>
          <p>Dúvidas: WhatsApp (48) 98500-1468, e-mail korraclubrunn@gmail.com ou Instagram @korrarunning.</p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
