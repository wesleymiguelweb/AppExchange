# Leitura do protótipo (Figma) e decisões de design

Arquivos de referência na raiz do projeto:

- `UI.JPEG` — design guide **HERMES** (paleta, tipografia, componentes, idiomas).
- `Wire.JPEG` — wireframe da página única (cabeçalho, faixa de título e três cartões).

> Observação técnica: os dois arquivos têm bytes **WebP** com extensão `.JPEG`.
> A leitura foi feita decodificando o conteúdo real, com amostragem de cores e
> OCR para os rótulos. Este documento registra o que foi extraído e como cada
> elemento virou código.

---

## 1. Design guide (UI.JPEG)

### 1.1 Paleta

| Token | Hex | Uso no projeto |
| --- | --- | --- |
| **Ink** | `#172B24` | Texto principal, botão primário, aba ativa do período |
| **Forest** | `#175F49` | Linha do gráfico, foco, acentos de estado positivo |
| **Paper** | `#F7F7F5` | Fundo da página, fundo de campos e cabeçalho de tabela |
| **Surface** | `#DCE4DF` | Skeletons, ícones de estado, fundo de botões secundários |
| **Accent** | `#DDECE5` | Seleção (linha da tabela, idioma ativo, painel de saída) |
| Branco | `#FFFFFF` | Superfície dos cartões |

Derivados (não são swatches do guide, mas nascem do Ink):

| Token | Valor | Uso |
| --- | --- | --- |
| `--ink-60` | `rgba(23,43,36,.60)` | Texto secundário |
| `--ink-45` | `rgba(23,43,36,.45)` | Legendas, contadores, eixos |
| `--border` | `rgba(23,43,36,.14)` | Bordas de 1px |
| `--hover` | `rgba(23,43,36,.04)` | Hover discreto |
| `--danger` | `#9E3B2A` | Erros (tom terroso coerente com a paleta) |
| `--success` | `#1C6B50` | Confirmação do CSV e variação positiva |

Não há gradientes, glassmorphism ou sombras coloridas. A sombra dos cartões é
quase imperceptível (`0 18px 40px -32px`), só para separar a superfície do papel.

### 1.2 Tipografia

- Família: **Inter** (400/500/600), carregada via Google Fonts com `preconnect`.
- Título da página: 30–42px (clamp), peso 600, `letter-spacing: -0.035em`.
- Corpo: 15px, `line-height: 1.55`.
- Valores do conversor: até 32px, tabulares (`font-variant-numeric`).
- Rótulos de seção/campos: 11–12px, maiúsculas, `letter-spacing: .08em`.
- Números sempre com algarismos tabulares para não "pular" ao atualizar.

### 1.3 Grid, raios e bordas

- Grade de **8px**: espaçamentos 4, 8, 12, 16, 24, 32, 40, 56
  (`--space-1..8`).
- Container máximo **1120px**, margem lateral de 24px (16px no mobile).
- Raios: **8px** (campos/botões), **10px** (painéis), **14px** (cartões),
  pill para abas e alternador de idioma.
- Bordas de **1px** em tudo que separa superfície; divisórias internas
  tracejadas no rodapé do conversor.
- Botão primário **Ink**; secundário **outline**; selecionado **Accent**.

### 1.4 Idiomas

O guide mostra **PT | EN | ES** no topo. Implementado como grupo de botões com
`aria-pressed`, persistência em `localStorage` e `<html lang>` sincronizado.

---

## 2. Wireframe (Wire.JPEG)

Estrutura de cima para baixo, na ordem exata do arquivo:

```
┌──────────────────────────────────────────────────────────────┐
│ logo HERMES                                   PT | EN | ES   │  header sticky
├──────────────────────────────────────────────────────────────┤
│ kicker · TÍTULO · descrição                                  │  faixa de título
├──────────────────────────────────────────────────────────────┤
│ CARTÃO 1 · CONVERSOR                                          │
│  valor (origem)        [trocar]        valor convertido       │
│  select DE                            select PARA             │
│  cotação atual · data                                         │
├──────────────────────────────────────────────────────────────┤
│ CARTÃO 2 · GRÁFICO HISTÓRICO                                  │
│  título                    7D 15D 30D 3M 6M 1A 5A 10A         │
│  linha do tempo (SVG)                                         │
│  atual · mínima · máxima · média · variação                   │
├──────────────────────────────────────────────────────────────┤
│ CARTÃO 3 · TABELA                                             │
│  busca .........  contagem ............ [ Exportar CSV ]      │
│  código | nome | taxa | valor convertido | ação               │
│  ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Mapa wireframe → componente

| Área do wireframe | Componente |
| --- | --- |
| Cabeçalho + logo + idiomas | `layout/Header.jsx`, `layout/LanguageSwitcher.jsx` |
| Faixa de título | `App.jsx` (`.intro`, `.eyebrow`, `h1`, descrição) |
| Cartão do conversor | `converter/ConverterCard.jsx`, `converter/CurrencySelect.jsx` |
| Cartão do histórico | `chart/ChartCard.jsx`, `PeriodTabs`, `RateChart`, `PeriodSummary` |
| Cartão da tabela | `rates/RatesCard.jsx`, `TableToolbar`, `RatesTable` |
| Ações e estados | `ui/Button`, `ui/Field`, `ui/StateBlock`, `ui/Toast` |
| Rodapé de fonte | `App.jsx` (`.footer`) |

Nenhuma seção além dessas foi criada. Não há sidebar, hero com imagem, cards de
KPI, modal de detalhes, favoritos, tema escuro ou paginação — nada disso está no
wireframe.

---

## 3. Fidelidade visual

| Elemento | Protótipo | Implementação |
| --- | --- | --- |
| Três cartões full-width empilhados | sim | `App.module.css` `.stack` + `Card` |
| Cartão do conversor com dois painéis e botão central | sim | grid `1fr 88px 1fr` no desktop; empilhado ≤860px |
| Painel de saída destacado | sim | `--accent` + borda verde suave |
| Oito períodos no topo do gráfico | sim | `PERIODS` com os mesmos rótulos |
| Resumo de cinco métricas | sim | `PeriodSummary` (5 colunas → 3 → 2) |
| Busca + contagem + CSV na mesma barra | sim | `TableToolbar` |
| Botão primário escuro / secundário outline | sim | `Button` (`primary`, `secondary`, `ghost`, `quiet`) |
| Ícones de linha fina | sim | `ui/Icon.jsx` (SVG 24×24, stroke 1.75) |
| Idioma no topo à direita | sim | `LanguageSwitcher` |

### Breakpoints adotados

| Largura | Ajuste |
| --- | --- |
| ≥ 1120px | layout de referência |
| ≤ 1119px | gráfico/resumo comprimem (5 → 3 métricas) |
| ≤ 860px | conversor em coluna; resumo em 3 colunas |
| ≤ 760px | tabela em cartões; select de ordenação aparece |
| ≤ 720px | cabeçalho compacto; paddings de 16px; rodapé em coluna |
| ≤ 520px | resumo em 2 colunas |

---

## 4. Estados desenhados além do wireframe

O wireframe mostra apenas o estado ideal. Para não deixar a interface "morta"
quando a API falha, foram criados estados coerentes com os tokens:

- **Loading**: skeleton de gráfico e linhas, pulsação de opacidade (sem
  gradiente), texto "Atualizando cotação…" no conversor.
- **Erro**: bloco com ícone de alerta, mensagem específica por tipo de falha e
  botão "Tentar novamente"; no conversor, faixa `--danger-soft`.
- **Vazio**: busca sem resultado e período sem dados, com ícone de lupa e
  mensagem que cita o termo buscado.
- **Sucesso**: toast com ícone de check para o CSV; erro de exportação usa o
  mesmo componente em tom de alerta.
- **Seleção**: linha da tabela em `--accent`, código com borda verde e selo
  "Selecionada".

---

## 5. Decisões em pontos ambíguos

1. **Sem botão "Converter"** — o wireframe não mostra ação; a conversão é
   derivada da taxa e do valor a cada tecla. O valor convertido usa `<output>`
   com `aria-live="polite"`.
2. **Períodos** — os oito rótulos foram mantidos. "7D" é uma janela fechada de
   7 datas de calendário (hoje + 6 anteriores); o intervalo exibido é o mesmo
   enviado à API, evitando rótulo e dados divergentes.
3. **Posição do "trocar"** — entre os dois painéis no desktop e entre os campos
   no mobile, como no wireframe. O botão é desabilitado durante requisições.
4. **Moeda oposta indisponível** — cada select remove a moeda já escolhida no
   outro lado. Preferiu-se impedir o estado inválido a exibir erro depois.
5. **Ação da linha da tabela** — o wireframe sinaliza uma ação por linha sem
   nomear. Optou-se por "Usar": define a moeda como destino do conversor e rola
   até o cartão (com respeito a `prefers-reduced-motion`). Não abre modal, para
   não inventar uma seção.
6. **CSV** — o botão fica na barra de filtros, à direita, como no wireframe. O
   arquivo exporta **as linhas visíveis** (filtro + ordenação), não a lista
   inteira; isso corresponde ao que o usuário está vendo.
7. **Formato do CSV** — `;` e BOM UTF-8 para abrir corretamente no Excel pt-BR;
   datas ISO e ponto decimal para preservar os dados. A tela usa vírgula
   decimal (pt-BR), o arquivo usa ponto — decisão documentada no README.
8. **Resumo do período** — o wireframe pede mínima/máxima/variação; foram
   acrescentadas "taxa atual" e "média" por serem deriváveis da mesma série e
   úteis para leitura. Ficam dentro do cartão do gráfico, sem novo cartão.
9. **Rodapé** — pequena linha de atribuição à fonte ("Dados: Frankfurter ·
   BCE") e aviso de taxas de referência. Não é uma seção de conteúdo.
10. **Idioma padrão** — `pt-BR`, com detecção do navegador antes do fallback.
    A troca não recarrega nem perde o estado do conversor.
11. **Erros e toasts** — não desenhados no wireframe; usam os tokens existentes
    e nunca inventam cores fora da paleta (apenas tons terrosos derivados).
12. **Tema escuro** — não existe no guide; não foi implementado para não
    contrariar o protótipo.
13. **Tipografia numérica** — a guia sugere valores grandes; no conversor o
    tamanho é responsivo (`clamp(26px, 3.4vw, 32px)`) para não quebrar valores
    longos como `18.136,00` em telas estreitas.

---

## 6. Como conferir a fidelidade

1. Abra `docs/evidence/desktop.png` ao lado do `Wire.JPEG`.
2. Compare a ordem dos blocos, a posição do alternador de idioma, os oito
   períodos e a barra busca/contagem/CSV.
3. Abra `docs/evidence/tablet.png` e `mobile.png` para ver a reflow.
4. `tokens.css` contém exatamente os hex do guide; nenhum componente declara
   cor hexadecimal fora dele.
