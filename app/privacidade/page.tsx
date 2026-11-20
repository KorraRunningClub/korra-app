import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Política de Privacidade · Korrá Running Club" };

const ATUALIZADO = "20 de novembro de 2026";

export default function PrivacidadePage() {
  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <article className="wrap doc-legal">
          <div className="eyebrow">LGPD</div>
          <h1>Política de Privacidade</h1>
          <p className="atualizado">Última atualização: {ATUALIZADO}</p>

          <p>
            Esta política explica, em linguagem simples, quais dados pessoais a Korrá Running Club coleta, por que,
            com quem compartilha e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados
            (Lei nº 13.709/2018, “LGPD”).
          </p>

          <h2>1. Quem cuida dos seus dados</h2>
          <p>
            O controlador dos dados é <b>Arthur Passoni Canônica</b> (CREF 035416-G/SC), responsável pela assessoria
            Korrá Running Club. Para qualquer assunto sobre seus dados, fale direto com ele pelo WhatsApp{" "}
            <b>(48) 98500-1468</b> ou pelo Instagram <b>@korrarunning</b>.
          </p>

          <h2>2. Quais dados coletamos</h2>
          <ul>
            <li><b>Cadastro:</b> nome completo, e-mail, WhatsApp, data de nascimento e objetivo de corrida.</li>
            <li><b>Menores de 18 anos:</b> nome e WhatsApp do responsável legal e o registro da autorização dele.</li>
            <li><b>Autorizações:</b> se você autoriza ou não o uso da sua imagem e a data em que aceitou esta política.</li>
            <li><b>Matrícula:</b> situação da matrícula (pendente, ativa ou bloqueada) e, quando houver, registros de mensalidades.</li>
            <li>
              <b>Strava (opcional):</b> se você conectar sua conta, recebemos um resumo das suas corridas: data,
              distância, tempo em movimento, tempo total, tipo (rua, trilha, esteira) e o nome da atividade.
              Não recebemos mapas, trajetos, fotos, frequência cardíaca nem a sua senha do Strava.
            </li>
            <li><b>Dados técnicos:</b> cookies essenciais de login e registros técnicos de acesso, necessários para o site funcionar com segurança.</li>
          </ul>

          <h2>3. Para que usamos e com qual base legal</h2>
          <ul>
            <li><b>Prestar a assessoria</b> (organizar treinos, contato, matrícula e mensalidade): execução de contrato (art. 7º, V).</li>
            <li><b>Segurança do login e do site:</b> legítimo interesse (art. 7º, IX).</li>
            <li><b>Ranking e desafios com o Strava:</b> consentimento (art. 7º, I). Você escolhe conectar e pode desconectar ou se esconder do ranking quando quiser.</li>
            <li><b>Uso de imagem</b> em fotos e vídeos de treinos no site e nas redes: consentimento (art. 7º, I), opcional.</li>
            <li><b>Dados de menores:</b> tratados no melhor interesse do menor, com consentimento específico do responsável legal (art. 14).</li>
            <li><b>Registros financeiros:</b> cumprimento de obrigação legal (art. 7º, II), quando aplicável.</li>
          </ul>
          <p>Não vendemos seus dados, não usamos para publicidade de terceiros e não usamos para treinar inteligência artificial.</p>

          <h2>4. Quem vê seus dados</h2>
          <ul>
            <li><b>O treinador</b> vê os dados do cadastro e dos treinos de todos os alunos.</li>
            <li>
              <b>Outros alunos ativos</b> veem apenas, no ranking, seu nome abreviado (ex.: “Arthur C.”) e o resultado
              (distância, pace ou quilometragem). Você pode sair do ranking a qualquer momento.
            </li>
            <li>Ninguém mais tem acesso à sua área.</li>
          </ul>

          <h2>5. Empresas que nos ajudam (operadores)</h2>
          <p>Para o site funcionar, usamos serviços que processam dados em nosso nome, com contratos e medidas de segurança próprios:</p>
          <ul>
            <li><b>Supabase</b>: banco de dados e login (servidores nos Estados Unidos).</li>
            <li><b>Cloudflare</b>: hospedagem do site e proteção contra ataques.</li>
            <li><b>Resend</b>: envio dos e-mails de acesso.</li>
            <li><b>Strava</b>: somente se você decidir conectar sua conta, conforme a política do próprio Strava.</li>
          </ul>
          <p>
            Como alguns desses serviços ficam fora do Brasil, pode haver transferência internacional de dados,
            feita com fornecedores que adotam padrões de proteção compatíveis com a LGPD (art. 33).
          </p>

          <h2>6. Por quanto tempo guardamos</h2>
          <ul>
            <li><b>Cadastro:</b> enquanto você for aluno. Depois do fim do vínculo, podemos manter o mínimo necessário por até 5 anos para cumprir obrigações legais e nos defender em eventuais questões.</li>
            <li><b>Treinos do Strava:</b> enquanto a conta estiver conectada. Ao desconectar, apagamos os treinos importados.</li>
            <li><b>Conta excluída:</b> ao excluir sua conta, apagamos cadastro, treinos e conexão com o Strava, exceto o que a lei obrigar a guardar.</li>
          </ul>

          <h2>7. Seus direitos</h2>
          <p>Você pode, a qualquer momento (art. 18):</p>
          <ul>
            <li>confirmar se tratamos seus dados e <b>acessá-los</b>: na sua área, em <Link href="/aluno/cadastro">Meus dados</Link>, há o botão <b>“Baixar meus dados”</b>;</li>
            <li><b>corrigir</b> dados incompletos ou errados, editando o cadastro;</li>
            <li><b>revogar consentimentos</b>: desconectar o Strava, sair do ranking ou retirar a autorização de imagem;</li>
            <li><b>pedir a exclusão</b> da sua conta: em Meus dados, botão <b>“Excluir minha conta”</b>;</li>
            <li>pedir informações sobre com quem compartilhamos seus dados;</li>
            <li>reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
          </ul>
          <p>Qualquer pedido também pode ser feito pelo WhatsApp (48) 98500-1468. Respondemos em até 15 dias.</p>

          <h2>8. Cookies</h2>
          <p>
            Usamos apenas cookies essenciais, que mantêm você logado com segurança. Não usamos cookies de
            publicidade nem de rastreamento de terceiros.
          </p>

          <h2>9. Segurança</h2>
          <p>
            O acesso é feito sem senha, por link ou código enviado ao seu e-mail. Os dados trafegam com criptografia
            (HTTPS), e cada aluno só consegue acessar os próprios dados. Se acontecer algum incidente de segurança
            que possa te afetar, avisaremos você e a ANPD.
          </p>

          <h2>10. Mudanças nesta política</h2>
          <p>Se esta política mudar, atualizamos a data no topo e avisamos os alunos quando a mudança for importante.</p>

          <p className="atualizado">Veja também os <Link href="/termos">Termos de Uso</Link>.</p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
