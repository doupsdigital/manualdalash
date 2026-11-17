import { SUPPORT_EMAIL } from '../lib/config'
import { LEGAL_OWNER, LegalLayout } from './LegalLayout'

export function Privacy() {
  const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
  return (
    <LegalLayout title="Política de Privacidade">
      <p className="text-[14px] text-white/60">Última atualização: 17 de novembro de 2026</p>

      <p>
        Esta política explica quais dados o <b>Manual da Lash Designer</b> coleta, para que usa e quais são os seus
        direitos, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD). Ela vale para a página de
        vendas e para o app, em manualdalash.com.br.
      </p>

      <h2>1. Quem cuida dos seus dados</h2>
      <p>
        O controlador dos dados descritos aqui é <b>{LEGAL_OWNER}</b>. Para qualquer assunto sobre privacidade, fale com a
        gente pelo e-mail {mail}.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <h3>Na compra</h3>
      <p>
        O pagamento é feito pela Cakto. Depois da compra, a Cakto nos envia os dados do pedido: nome, e-mail, telefone e
        documento (quando informados), número do pedido, produto e situação do pagamento.{' '}
        <b>Não recebemos nem guardamos dados do seu cartão</b>: eles ficam apenas com a Cakto.
      </p>
      <h3>No app</h3>
      <ul>
        <li>O e-mail que você usa para entrar.</li>
        <li>O seu primeiro nome, vindo da compra, para o app cumprimentar você.</li>
        <li>Seu progresso: lições concluídas e datas, itens marcados no checklist e a última lição vista.</li>
      </ul>
      <h3>Só no seu aparelho</h3>
      <p>
        O app guarda uma cópia do seu progresso no próprio navegador para abrir mais rápido. O tamanho do texto escolhido
        e, para quem tem a Tabela de Preços, o nome do estúdio, o Instagram e os preços digitados{' '}
        <b>ficam apenas no seu aparelho</b> e não são enviados para nós.
      </p>
      <h3>Na página de vendas</h3>
      <p>
        A página de vendas pode usar o <b>Pixel da Meta</b> (empresa dona do Facebook e do Instagram). Ele registra visitas
        à página e cliques no botão de compra e, no checkout da Cakto, o início da compra e a compra concluída. Com isso,
        medimos quais anúncios funcionam e mostramos anúncios para pessoas com interesse parecido. O pixel usa cookies e
        identificadores do seu navegador. Você pode limitar o uso desses dados nas configurações de anúncios da sua conta
        do Facebook ou do Instagram e bloquear cookies de terceiros no seu navegador. O app, depois do login, não usa o
        pixel. Como qualquer site, o servidor de hospedagem registra dados técnicos de acesso (como endereço IP e
        navegador) para segurança e funcionamento.
      </p>
      <h3>Análise de uso</h3>
      <p>
        Usamos o <b>PostHog</b> para entender como a página de vendas e o app são usados: páginas e telas visitadas,
        até onde a página foi rolada, botões clicados, lições abertas e concluídas e buscas feitas no app. Na página de
        vendas, também gravamos a navegação (movimentos e cliques na tela) para encontrar o que está confuso.{' '}
        <b>Nada do que você digita é gravado</b>. No app, o uso fica ligado a um código interno da sua conta, nunca ao
        seu e-mail. Até você clicar em “Ok” no aviso de cookies, o PostHog não guarda nada no seu aparelho.
      </p>

      <h2>3. Para que usamos os dados</h2>
      <ul>
        <li>Liberar o seu acesso depois da compra e retirá-lo em caso de reembolso ou estorno.</li>
        <li>Enviar o e-mail de boas-vindas e o link e o código de acesso.</li>
        <li>Salvar o seu progresso para você continuar de onde parou, em qualquer aparelho.</li>
        <li>Responder aos seus pedidos de suporte.</li>
        <li>Medir e melhorar os nossos anúncios (Pixel da Meta na página de vendas).</li>
        <li>Entender como a página e o app são usados, para melhorar o conteúdo e a navegação (PostHog).</li>
        <li>Cumprir obrigações legais e prevenir fraudes.</li>
      </ul>
      <p>Não vendemos nem alugamos os seus dados para ninguém, e não enviamos mensagens de propaganda de terceiros.</p>

      <h2>4. Bases legais</h2>
      <p>
        Tratamos os seus dados para <b>executar o contrato</b> de compra e de uso do app, para{' '}
        <b>cumprir obrigações legais</b> e pelo nosso <b>legítimo interesse</b> em manter o serviço seguro e em divulgar o
        produto.
      </p>

      <h2>5. Com quem compartilhamos</h2>
      <p>Usamos empresas que nos ajudam a operar o produto e que tratam os dados apenas para isso:</p>
      <ul>
        <li>
          <b>Cakto</b>: pagamento e emissão de documentos da compra.
        </li>
        <li>
          <b>Supabase</b>: banco de dados e sistema de login do app.
        </li>
        <li>
          <b>Vercel</b>: hospedagem da página de vendas e do app.
        </li>
        <li>
          <b>Resend</b>: envio dos e-mails de acesso e de boas-vindas.
        </li>
        <li>
          <b>Meta</b>: medição e otimização dos anúncios no Facebook e no Instagram (Pixel da Meta).
        </li>
        <li>
          <b>PostHog</b>: análise de uso da página de vendas e do app.
        </li>
      </ul>
      <p>
        Alguns desses serviços guardam dados em servidores fora do Brasil. Nesses casos, a transferência acontece para
        executar o contrato com você e com empresas que adotam medidas de segurança adequadas, como prevê a LGPD. Também
        podemos compartilhar dados quando a lei ou uma ordem judicial exigir.
      </p>

      <h2>6. Por quanto tempo guardamos</h2>
      <p>
        Guardamos os dados enquanto o seu acesso existir. Se você pedir a exclusão, apagamos os seus dados do app em até
        15 dias, exceto o que precisarmos manter por obrigação legal, como os registros da compra.
      </p>

      <h2>7. Seus direitos</h2>
      <p>Pela LGPD, você pode pedir a qualquer momento:</p>
      <ul>
        <li>a confirmação de que tratamos seus dados e uma cópia deles;</li>
        <li>a correção de dados incompletos ou errados;</li>
        <li>a exclusão dos seus dados;</li>
        <li>a portabilidade dos dados;</li>
        <li>informações sobre com quem compartilhamos.</li>
      </ul>
      <p>
        Para isso, escreva para {mail} a partir do e-mail da compra. Respondemos em até 15 dias. Você também pode
        reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>8. Segurança</h2>
      <p>
        O acesso ao app é feito sem senha, por link ou código enviado ao seu e-mail. Cada conta só consegue ver os próprios
        dados, e toda a comunicação é criptografada. Nenhum sistema é 100% seguro, mas adotamos medidas para proteger as
        suas informações e avisaremos você caso aconteça algum incidente relevante.
      </p>

      <h2>9. Idade</h2>
      <p>O Manual da Lash Designer é destinado a pessoas maiores de 18 anos.</p>

      <h2>10. Mudanças nesta política</h2>
      <p>
        Podemos atualizar esta política. Quando a mudança for importante, avisaremos pelo e-mail da compra ou dentro do
        app. A data no topo mostra a última atualização.
      </p>
    </LegalLayout>
  )
}
