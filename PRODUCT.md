# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Lash designers no Brasil, em português: quem quer começar na profissão, quem está começando
e quem já atende e quer ir mais longe. Usam quase só o celular, muitas vezes entre um
atendimento e outro. Chegam à página de vendas por anúncios do Instagram (tráfego frio).

## Product Purpose

O Manual da Lash Designer é uma apostila em forma de app (PWA): 11 módulos, 60 lições curtas
(2 a 4 min cada) que vão do primeiro fio à agenda cheia — profissão, materiais, fios e
curvaturas, preparação, técnicas, mapping, manutenção e remoção, cuidados da cliente, erros
comuns, quanto cobrar e como conseguir clientes. Sucesso: a lash designer encontra a resposta
na hora em que precisa e volta a consultar.

## Positioning

Não é um PDF de 200 páginas: lições curtas, diretas (passo a passo, dicas, erros comuns), com
busca e progresso salvo, num app que abre no navegador do celular e vai para a tela inicial.
Pagamento único de R$ 27, sem mensalidade.

## Operating Context

- Venda pela Kiwify, produto "Manual da Lash Designer", R$ 27, pagamento único, acesso
  imediato, garantia de 7 dias. Dois extras avulsos de R$ 12,90 (Mensagens que Fecham Horário,
  Tabela de Preços da Lash) como order bump e dentro do app.
- Acesso: e-mail da compra + código de 8 dígitos (ou link mágico). E-mail de boas-vindas na
  primeira compra.
- Bônus incluídos: Checklist do Atendimento Perfeito, Guia Visual de Fios e Curvaturas.
- Página de vendas em /lp (anúncios), páginas legais /termos e /privacidade.

## Capabilities and Constraints

- App: React + Vite + Tailwind 4, Supabase (login/progresso), Vercel, PWA.
- A página de vendas não pode carregar Supabase nem o código do app.
- Pixel da Meta (ID ainda vazio), UTMs e fbclid repassados ao checkout.
- Responsável legal: "Manual da Lash Designer - Um produto Doup - Soluções Digitais".
  Suporte: suporte@manualdalash.com.br.
- Link de checkout do produto principal: a dona vai fornecer (constante em `src/lib/config.ts`).

## Brand Commitments

- Nome: Manual da Lash Designer. Frase: "Do primeiro fio à agenda cheia".
- Voz: português simples e direto, próximo ("Ei, Lash Designer 👋"), sem exagero.
- Nunca usar termos de saúde (alergia, irritação, inflamação, doença, remédio, paciente,
  diagnóstico).
- Simples, bonito, elegante e funcional — é uma apostila, não um SaaS.
- Arte do livro: `public/lp/livro.png`, `livro-titulo.png`, `banner.jpg` (fundo magenta opaco).

## Evidence on Hand

- Conteúdo real do manual em `src/content/manual.json`; capas dos módulos em `public/modulos/`.
- Prints do app gerados a partir do próprio app (demonstração).
- Não há depoimentos, números de clientes nem prova social: não inventar. Sem contador
  regressivo, sem preço "de/por", sem "vagas limitadas".

## Product Principles

1. Apostila, não SaaS: clareza e consulta rápida antes de recurso.
2. Honestidade comercial: só fatos reais sobre o produto, preço e garantia.
3. Celular primeiro: tudo pensado para uma mão e 4G.
4. Um passo de cada vez: uma ação por tela, um objetivo por página.
