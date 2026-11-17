import { SUPPORT_EMAIL } from '../lib/config'
import { LEGAL_OWNER, LegalLayout } from './LegalLayout'

export function Terms() {
  return (
    <LegalLayout title="Termos de Uso">
      <p className="text-[14px] text-white/60">Última atualização: 17 de novembro de 2026</p>

      <p>
        Estes termos explicam as regras de compra, acesso e uso do <b>{LEGAL_OWNER}</b>. Ao comprar ou usar o app, você
        concorda com eles.
      </p>

      <h2>1. O que é o Manual da Lash Designer</h2>
      <p>
        O Manual da Lash Designer é um app digital para Lash Designers, acessado pelo navegador em manualdalash.com.br. Ele
        reúne 11 módulos com 60 lições curtas e dois bônus: o Checklist do Atendimento Perfeito e o Guia Visual de Fios e
        Curvaturas. Não é um produto físico nem um curso em vídeo.
      </p>

      <h2>2. Compra e acesso</h2>
      <ul>
        <li>A compra é feita pela Cakto, por pagamento único, sem mensalidade.</li>
        <li>
          O acesso é liberado automaticamente para o <b>e-mail usado na compra</b>. Para entrar, você recebe um link ou
          código nesse e-mail.
        </li>
        <li>
          O acesso é <b>pessoal e intransferível</b>. Não é permitido compartilhar a sua conta.
        </li>
        <li>
          O acesso continua ativo enquanto o produto estiver no ar. Se um dia ele for descontinuado, avisaremos pelo e-mail
          da compra com pelo menos 30 dias de antecedência.
        </li>
      </ul>

      <h2>3. Extras opcionais</h2>
      <p>
        Mensagens que Fecham Horário e Tabela de Preços da Lash são extras vendidos à parte, também por pagamento único,
        no checkout ou dentro do app. Eles não fazem parte do manual e não são necessários para usá-lo. Depois de
        comprados, ficam liberados para o mesmo e-mail.
      </p>

      <h2>4. Garantia e reembolso</h2>
      <p>
        Você tem <b>7 dias</b> a partir da compra para pedir o reembolso, sem precisar explicar o motivo, como garante o
        Código de Defesa do Consumidor. O pedido é feito pela Cakto ou pelo e-mail{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Depois do reembolso, ou em caso de estorno no cartão, o
        acesso ao produto reembolsado é encerrado automaticamente.
      </p>

      <h2>5. O que você pode fazer</h2>
      <ul>
        <li>Ler e consultar o conteúdo sempre que quiser, no celular ou no computador.</li>
        <li>Usar o que aprendeu no seu próprio trabalho e no seu estúdio.</li>
      </ul>

      <h2>6. O que não é permitido</h2>
      <ul>
        <li>
          Revender, distribuir ou publicar o conteúdo do app, no todo ou em parte, como material próprio, curso, e-book ou
          produto.
        </li>
        <li>Compartilhar o seu acesso com outras pessoas.</li>
        <li>Tentar copiar o app, burlar o login ou atrapalhar o funcionamento do serviço.</li>
      </ul>
      <p>Se alguma dessas regras for descumprida, o acesso pode ser encerrado sem reembolso após o prazo de garantia.</p>

      <h2>7. Resultados</h2>
      <p>
        O manual entrega conhecimento prático, mas <b>não garante um número de clientes ou de faturamento</b>. Os
        resultados dependem de como você aplica o conteúdo, da sua prática, da sua região, dos seus preços e de outros
        fatores que não controlamos. O conteúdo não substitui um curso prático presencial.
      </p>

      <h2>8. Funcionamento do app</h2>
      <p>
        Trabalhamos para manter o app no ar e funcionando bem, mas podem acontecer interrupções para manutenção ou por
        falhas de serviços de terceiros. Podemos melhorar, atualizar ou reorganizar o conteúdo ao longo do tempo, sem
        retirar o que é essencial do produto.
      </p>

      <h2>9. Propriedade intelectual</h2>
      <p>
        Os textos, imagens, a marca e o design do Manual da Lash Designer pertencem aos seus criadores e são protegidos
        pela lei de direitos autorais. A compra dá a você uma licença de uso pessoal, conforme estes termos, e não
        transfere esses direitos.
      </p>

      <h2>10. Privacidade</h2>
      <p>
        A forma como tratamos os seus dados está descrita na <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>11. Mudanças nestes termos</h2>
      <p>
        Podemos atualizar estes termos. Quando a mudança for importante, avisaremos pelo e-mail da compra ou dentro do app.
        As mudanças não reduzem direitos que você já tinha na data da compra.
      </p>

      <h2>12. Lei aplicável</h2>
      <p>
        Estes termos seguem as leis brasileiras, incluindo o Código de Defesa do Consumidor. Fica eleito o foro do seu
        domicílio para resolver qualquer questão.
      </p>
    </LegalLayout>
  )
}
