---
name: Manual da Lash Designer
description: A apostila da lash designer, sempre à mão no celular.
colors:
  night: "#4A2140"
  plum: "#5B2A4E"
  plum-glow: "#7A3A66"
  plum-2: "#8A3F6F"
  rose: "#E07A9B"
  blush: "#FBE8EE"
  gold: "#C9A15B"
  gold-light: "#E8C27E"
  gold-soft: "#F6EBD3"
  gold-ink: "#8A6A24"
  lilac: "#EDE1EA"
  green: "#34C759"
  ink: "#2A1E27"
typography:
  display:
    fontFamily: "Bodoni Moda, serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.1
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.025em"
rounded:
  sm: "14px"
  md: "18px"
  card: "24px"
  hero: "28px"
  pill: "999px"
spacing:
  gutter: "20px"
  card: "18px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.rose}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    height: "52px"
  button-ghost:
    backgroundColor: "rgba(255,255,255,0.10)"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    height: "44px"
  card:
    backgroundColor: "rgba(255,255,255,0.07)"
    textColor: "#FFFFFF"
    rounded: "{rounded.card}"
    padding: "18px"
  input:
    backgroundColor: "rgba(255,255,255,0.08)"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    height: "56px"
---

# Design System: Manual da Lash Designer

## Overview

**Creative North Star: "O caderno de veludo"**

Um caderno de estúdio encadernado em veludo ameixa, com cantoneiras douradas: escuro, quente e
íntimo, para ser aberto entre um atendimento e outro. O fundo é sempre ameixa profundo; o
conteúdo flutua em superfícies translúcidas de branco, e a cor só aparece onde tem função — rosa
para a ação, dourado para o que é especial (selos, checks, rótulos).

A densidade é de apostila, não de painel: uma coluna, blocos curtos, respiro generoso. O serifado
Bodoni Moda é usado como joia, só em números grandes e no nome do produto; todo o resto é Inter.

**Key Characteristics:**
- Fundo escuro ameixa, nunca branco.
- Cards translúcidos (branco 5–8%, borda branca 10–14%).
- Rosa = ação; dourado = destaque/selo; branco com opacidade = hierarquia de texto.
- Formas arredondadas e pílulas; nada de cantos retos.
- Bodoni só em números e no nome.

## Colors

Paleta de joalheria sobre veludo: ameixa em camadas, um rosa quente de ação e dourado envelhecido.

### Primary
- **Rosa Cílio** (rose): botões principais, progresso, números dos módulos, destaque no título.

### Secondary
- **Dourado Envelhecido** (gold) e **Dourado Luz** (gold-light): rótulos em caixa alta, selos,
  checks, ícones especiais e o cílio do ícone do app.

### Neutral
- **Ameixa Noite** (night): fundo principal do app e da página.
- **Ameixa** (plum) e **Ameixa Brilho** (plum-glow): seções alternadas, degradês de topo, menus.
- **Blush** (blush): única superfície clara, usada quando algo precisa inverter e virar o
  destaque (card de oferta), com texto em ameixa/ink.
- Texto: branco puro para títulos; branco 85% corpo; branco 60% apoio/metadados.

### Named Rules
**The Velvet Floor Rule.** O fundo é sempre ameixa (night/plum). Branco só aparece como texto ou
em transparência; a única superfície clara é o blush, reservada a um destaque por tela.

**The Gold Means Special Rule.** Dourado nunca é botão. É selo, check, rótulo ou ícone.

## Typography

**Display Font:** Bodoni Moda (serif)
**Body Font:** Inter (com -apple-system como fallback)

**Character:** Inter limpo e legível para estudar; Bodoni Moda contrastado como ornamento
editorial pontual.

### Hierarchy
- **Display** (Bodoni 500, 34–56px, 1.1): nome do produto na entrada, números de módulo.
- **Headline** (Inter 700, 22–30px, tracking apertado): saudação, títulos de seção.
- **Title** (Inter 700, 16–18px, 1.35): títulos de card e lição.
- **Body** (Inter 400, 15–17px, 1.5): texto das lições (tamanho ajustável 16/17/19).
- **Label** (Inter 600, 13px, caixa alta, tracking leve): rótulos dourados/brancos 60%.

### Named Rules
**The Jewel Serif Rule.** Bodoni só em números grandes e no nome do produto. Nunca em parágrafo.

## Layout

App em coluna única, largura máxima 430px, gutter de 20–28px. Seções empilhadas com 24px entre
blocos; listas de cards com 10–12px de espaço. Barra de abas fixa embaixo nas telas principais.

## Elevation & Depth

Profundidade por camadas tonais (branco translúcido sobre ameixa), não por sombra. Sombras só em
elementos flutuantes (menu, mockups), escuras e difusas.

### Named Rules
**The Tonal Layer Rule.** Um card sobe por transparência e borda clara, não por sombra.

## Shapes

Tudo arredondado: cards 24–28px, campos 14–18px, botões em pílula. Ícones de linha com traço
1.7, pontas e junções arredondadas.

## Components

### Buttons
- **Shape:** pílula (999px).
- **Primary:** fundo rosa, texto branco semibold, 52px de altura; `active` encolhe para 97%.
- **Ghost:** branco 10%, texto branco, 44px.

### Cards / Containers
- **Corner Style:** 24px (cards de lista), 28px (card de destaque).
- **Background:** branco 7% com borda branca 10%; destaque com branco 16% e borda 20%.
- **Internal Padding:** 16–22px.

### Inputs / Fields
- **Style:** branco 8%, borda branca 14–20%, 54–56px, raio 16–18px, texto 15–17px semibold.

### Navigation
- Barra de abas inferior fixa; botão voltar circular ghost de 44px.

## Do's and Don'ts

### Do:
- **Do** manter o fundo ameixa (#4A2140 / #5B2A4E) em todas as superfícies.
- **Do** usar rosa (#E07A9B) só para a ação principal e destaques de título.
- **Do** usar dourado para selos, checks e rótulos.
- **Do** usar cards translúcidos (branco 5–8%, borda 10–14%).

### Don't:
- **Don't** usar fundos brancos ou claros além do blush de destaque.
- **Don't** usar Bodoni em texto corrido.
- **Don't** usar termos de saúde em nenhum texto.
- **Don't** usar dourado como cor de botão.
