# Hermes · Câmbio com clareza

SPA em **React + Vite** para conversão de moedas, análise histórica por período e exportação de cotações em CSV, usando apenas dados públicos de referência do **Banco Central Europeu** via [Frankfurter](https://frankfurter.dev). A interface segue o design guide e o wireframe fornecidos (direção editorial **HERMES**), com suporte a **PT-BR, EN e ES**.

![Visão geral em desktop](docs/evidence/desktop.png)

---

## 1. O que a aplicação faz

| Área | O que entrega |
| --- | --- |
| **Conversor** | Valor editável, moedas de origem/destino, troca rápida, cotação atual, data da cotação e valor convertido — tudo recalculado em tempo real. |
| **Análise histórica** | Oito períodos (7D, 15D, 30D, 3M, 6M, 1A, 5A, 10A), gráfico de linha em SVG puro, tooltip/crosshair, navegação por teclado e resumo com taxa atual, mínima, máxima, média e variação %. |
| **Tabela de cotações** | Todas as moedas suportadas contra a moeda de origem, busca por código ou nome (sem acento), ordenação por código/nome/taxa, valor convertido por linha e ação para usar a moeda no conversor. |
| **CSV** | Exportação sem bibliotecas externas: `data;base;destino;nome;taxa;valor convertido`, UTF-8 com BOM, `;` como separador, datas ISO e ponto decimal. |
| **Idiomas** | PT-BR (padrão), EN e ES. O idioma é detectado pelo navegador, pode ser trocado no cabeçalho e fica salvo em `localStorage`. |
| **Estados** | Carregamento (skeleton), erro com "Tentar novamente" por cartão, vazio por busca sem resultado e feedback de sucesso/erro no CSV via toast. |

Não há login, chave de API, backend próprio ou dependência de UI kit.

---

## 2. Stack e justificativas

| Escolha | Por quê |
| --- | --- |
| **React 19 + Vite 7** | Requisito do trabalho; Vite entrega dev server rápido e build otimizado sem configuração extra. |
| **JavaScript + JSX (sem TypeScript)** | Mantém o foco nos fundamentos pedidos (componentes, props, estado, efeitos e hooks). |
| **CSS Modules** | Escopo local por componente, zero dependência em runtime e controle total dos tokens do design guide. Tailwind foi descartado porque o protótipo exige muitos valores específicos (grid de 8px, tipografia editorial, bordas de 1px) e o CSS Modules deixa a intenção mais legível na entrega acadêmica. |
| **SVG puro para o gráfico** | Nenhuma biblioteca de charting é necessária: o controle de eixo, escala, crosshair, tooltip e teclado fica explícito no código — e vira evidência de domínio de SVG/React. |
| **`prop-types`** | Validação simples de props em tempo de desenvolvimento, sem custo no bundle de produção (o React não remove, mas o custo é mínimo). |
| **`Intl` (nativo)** | Formatação de números, moedas, percentuais e datas por locale sem bibliotecas. `Intl.DisplayNames` resolve os nomes das moedas. |
| **Dicionário próprio de i18n** | Três idiomas, mensagens com interpolação e troca em runtime sem dependências. |

---

## 3. Como executar

Requisitos: **Node.js 20.19+** (ou 22.12+) e npm.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (por padrão `http://localhost:5173`).

Outros comandos:

```bash
npm run build     # build de produção em dist/
npm run preview   # serve o build localmente
```

> Observação para Windows: se o PowerShell bloquear `npm.ps1`, use `npm.cmd` nos mesmos comandos.

---

## 4. Estrutura do projeto

```
AppExchange/
├── docs/
│   ├── CHECKLIST.md          # requisitos do trabalho → evidência no código
│   ├── EVIDENCE.md           # trechos de código, capturas e resultados de teste
│   ├── PROTOTIPO.md          # leitura do design guide e do wireframe
│   ├── QA.md                 # matriz de testes executados
│   └── evidence/             # capturas desktop, tablet, mobile e estados
├── postman/
│   └── Hermes-Frankfurter.postman_collection.json
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── chart/            # ChartCard, PeriodTabs, RateChart, PeriodSummary
│   │   ├── converter/        # ConverterCard, CurrencySelect
│   │   ├── layout/           # Header, LanguageSwitcher
│   │   ├── rates/            # RatesCard, RatesTable, TableToolbar
│   │   ├── ui/               # Button, Card, Field, Icon, StateBlock, Toast
│   │   └── AppErrorBoundary.jsx
│   ├── constants/periods.js  # os oito períodos do wireframe
│   ├── hooks/                # useCurrencies, useLatestRates, useExchangeRate,
│   │                         # useHistoricalRates, useDebouncedValue, useToast,
│   │                         # useElementWidth
│   ├── i18n/                 # provider, hook e dicionários PT/EN/ES
│   ├── services/             # http.js (fetch/erros) e frankfurterApi.js
│   ├── styles/               # tokens.css (HERMES) e global.css
│   ├── utils/                # csv, dates, format, series, validation, erro, cx
│   ├── App.jsx               # estado compartilhado e composição da página
│   ├── App.module.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

### Onde começar a ler

1. `src/services/frankfurterApi.js` — contrato com a API.
2. `src/hooks/useHistoricalRates.js` — ciclo de vida de uma requisição com cancelamento.
3. `src/App.jsx` — estado compartilhado, derivações e exportação.
4. `src/components/chart/RateChart.jsx` — gráfico, interação e acessibilidade.
5. `src/components/rates/RatesCard.jsx` — busca, ordenação e estado vazio.

---

## 5. Consumo da API

Base: `https://api.frankfurter.dev/v1` — pública, **sem chave**.

| Uso | Endpoint | Exemplo |
| --- | --- | --- |
| Lista de moedas | `GET /currencies` | `https://api.frankfurter.dev/v1/currencies` |
| Últimas taxas por base | `GET /latest?base={BASE}` | `https://api.frankfurter.dev/v1/latest?base=BRL` |
| Série histórica | `GET /{start}..{end}?base={BASE}&symbols={QUOTE}` | `https://api.frankfurter.dev/v1/2026-10-04..2026-11-02?base=BRL&symbols=USD` |

Exemplo de resposta de `/latest`:

```json
{
  "amount": 1.0,
  "base": "BRL",
  "date": "2026-10-30",
  "rates": {
    "AUD": 0.2831,
    "USD": 0.1839,
    "EUR": 0.1587
  }
}
```

### Isolamento e tratamento de falhas

- `src/services/http.js` é a única camada que chama `fetch`. Ela aplica **timeout de 12s**, encaminha `AbortSignal`, valida o JSON e normaliza tudo em `ApiError` com `type` (`network`, `http`, `invalid`, `timeout`).
- `src/services/frankfurterApi.js` valida o formato de cada payload (`rates` precisa existir e ser objeto) e normaliza datas e números.
- Os componentes nunca veem `fetch` nem status HTTP: recebem `isLoading`, `error` e `retry`. `src/utils/errorMessages.js` converte o erro em chave de tradução.

### Economia de requisições

- **Moedas**: uma requisição ao montar (`useCurrencies`).
- **Últimas taxas**: uma por moeda de origem (`useLatestRates`). O conversor e a tabela compartilham o mesmo mapa — trocar apenas a moeda de destino **não** refaz a chamada.
- **Histórico**: só quando muda o par ou o período; a requisição anterior é abortada (`AbortController`) para evitar corrida e desperdício.
- **Busca e ordenação**: 100% no cliente; não geram requisição.
- `useDebouncedValue` evita recalcular o filtro a cada tecla.

---

## 6. Regras de negócio e decisões

- **Conversão ao vivo**: o valor é recalculado a cada tecla a partir da taxa mais recente; não existe botão "converter" no wireframe.
- **Validação do valor** (`src/utils/validation.js`): aceita `1.234,56` em PT/ES e `1,234.56` em EN, exige número finito **> 0**, limita a 1.000.000.000 e ignora letras/símbolos na digitação. Mensagens específicas para vazio, inválido e acima do limite, ligadas ao campo por `aria-describedby` + `aria-invalid`.
- **Moeda de origem ≠ destino**: o select oposto remove a moeda já escolhida, impedindo o par inválido sem depender de mensagem de erro.
- **Troca (swap)**: inverte origem e destino em um clique; o botão fica desabilitado durante o carregamento.
- **Tabela**: mostra 1 unidade da moeda de origem em todas as demais. A coluna "Valor convertido" usa o valor digitado no conversor. O botão "Usar" define a moeda como destino do conversor e rola até o topo do cartão (respeitando `prefers-reduced-motion`).
- **Períodos**: os oito rótulos do wireframe são mantidos. "7D" significa uma janela fechada de 7 datas (hoje + 6 anteriores); o intervalo exibido é sempre o mesmo enviado à API.
- **CSV**: usa `;` (padrão de planilhas pt-BR), BOM UTF-8 (acentos corretos no Excel), datas ISO e ponto decimal para não corromper números. O nome inclui o par e a data: `hermes-BRL-USD-2026-11-02.csv`.
- **Ordenação**: clicar no cabeçalho alterna crescente/decrescente; a primeira ordem de "Taxa" é decrescente (maior primeiro), por ser a leitura mais útil. Em telas pequenas, um `<select>` equivalente aparece na barra de ferramentas.
- **Idioma**: `pt-BR` por padrão, com detecção do navegador e persistência em `localStorage` (`hermes.locale`). `document.documentElement.lang` acompanha a troca.
- **Sem seções inventadas**: a página tem exatamente cabeçalho, faixa de título, conversor, histórico e tabela/filtros/CSV, além do rodapé de fonte.

---

## 7. Acessibilidade

- Labels reais (`<label for>`) em todos os campos; selects nativos.
- Erros com `role="alert"`, `aria-invalid` e `aria-describedby` apontando para a mensagem.
- Foco visível global (`:focus-visible`) e *skip link* "Pular para o conteúdo".
- Botões desabilitados durante requisições e `aria-busy` no botão de carregamento.
- Gráfico focável: setas ←/→ navegam ponto a ponto, `Home`/`End` vão às extremidades; cada ponto é anunciado em região `aria-live`, e o SVG tem `role="img"` + descrição textual (início, fim, mínima, máxima).
- Tabela com `<caption>` (sr-only), `scope="col"`/`scope="row"` e `aria-sort` sincronizado.
- Contagem de resultados em `aria-live="polite"`; toast com `role="status"`/`role="alert"`.
- Contraste: texto principal `#172B24` sobre `#F7F7F5` (≈ 13:1); textos secundários mantêm ≥ 4.5:1.
- `prefers-reduced-motion` desliga animações e rolagem suave.
- Layout mobile da tabela usa cartões empilhados com rótulos visíveis, sem depender de scroll horizontal.

---

## 8. Responsividade

| Faixa | Comportamento |
| --- | --- |
| **≥ 1120px** | Container central de 1120px, conversor em duas colunas com botão de troca no meio, gráfico e tabela em largura total. |
| **861–1119px** | Container fluido; gráfico e resumo se reorganizam (5 → 3 colunas de métricas). |
| **≤ 860px** | Conversor empilha origem → troca → destino. |
| **≤ 760px** | Tabela vira cartões; barra de ferramentas mostra o select de ordenação. |
| **≤ 720px** | Cabeçalho compacto (esconde o kicker), paddings reduzidos, rodapé em coluna. |

Capturas: [desktop](docs/evidence/desktop.png) · [tablet](docs/evidence/tablet.png) · [mobile](docs/evidence/mobile.png). Métricas verificadas: nenhum overflow horizontal em 1440, 834 e 390px.

---

## 9. Requisitos do trabalho

A matriz completa, com arquivo e linha de cada item, está em [`docs/CHECKLIST.md`](docs/CHECKLIST.md). Resumo:

- Componentes funcionais, JSX, props e `propTypes` — `src/components/**`.
- `useState` + inputs controlados — `App.jsx`, `ConverterCard.jsx`, `RatesCard.jsx`.
- **Lifting State Up** — `App.jsx` centraliza valor, par e período.
- `useEffect` com limpeza — `useCurrencies`, `useLatestRates`, `useHistoricalRates`, `useToast`, `useElementWidth`.
- **Hooks customizados** — `useCurrencies`, `useExchangeRate`, `useHistoricalRates`, `useDebouncedValue` (+ `useLatestRates`, `useToast`, `useElementWidth`).
- `fetch` + `async/await` — `services/http.js` e `services/frankfurterApi.js`.
- Arrays/objetos — `map`, `filter`, `sort`, `reduce`, `Object.entries`, spread e desestruturação.
- Gráfico — SVG puro com escala, eixos, área, crosshair e tooltip.
- Filtros/ordenação — `RatesCard.jsx` com busca sem acento e `aria-sort`.
- CSV — `utils/csv.js` sem bibliotecas.
- Formatação pt-BR — `utils/format.js` com `Intl`.
- Git/GitHub — seção 10 e [`docs/COMMITS.md`](docs/COMMITS.md).

---

## 10. Git e GitHub

Repositório público: <https://github.com/wesleymiguelweb/AppExchange> — o remoto
`origin` já está configurado e o histórico usa commits convencionais.

```bash
# Enviar a branch principal
git push origin main
```

Fluxo de trabalho sugerido:

```bash
git checkout -b feat/nome-da-melhoria
# ... alterações ...
git add .
git commit -m "feat: descrever a melhoria"
git push -u origin feat/nome-da-melhoria
# abra o Pull Request no GitHub
```

Commits sugeridos (histórico real em [`docs/COMMITS.md`](docs/COMMITS.md)):

```
chore: configurar React com Vite
feat: criar camada de serviços da Frankfurter
feat: adicionar hooks de câmbio com cancelamento
feat: montar conversor com validação e troca de moedas
feat: desenhar gráfico histórico em SVG
feat: listar cotações com busca e ordenação
feat: exportar cotações em CSV
feat: internacionalizar em PT, EN e ES
style: aplicar design tokens HERMES e responsividade
docs: registrar checklist, evidências e coleção Postman
```

---

## 11. Verificação

- `npm run build` conclui com sucesso (Vite 7, ~280 kB de JS / 88 kB gzip).
- Testes manuais e automatizados via Chrome headless registrados em [`docs/QA.md`](docs/QA.md): validação, swap, 8 períodos, busca com/sem acento, ordenação, seleção de linha, download do CSV, 3 idiomas, foco no gráfico e simulação de falha total da API.
- Nenhum erro de console nas execuções finais.

---

## 12. Limitações

- A Frankfurter publica **taxas de referência diárias do BCE**, não preços em tempo real nem spread comercial. Fins de semana e feriados não têm cotação.
- A série é diária por natureza da fonte; não há candles intradiários.
- O app depende de rede para carregar; quando a API falha, cada cartão mostra erro e permite tentar novamente (não há cache offline).
- Não há testes unitários automatizados (o escopo pedia build funcional e documentação); a verificação foi feita por build + roteiro de QA documentado.

---

## 13. Dados e créditos

- Dados: [Frankfurter](https://frankfurter.dev) · Banco Central Europeu.
- Tipografia: [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts).
- Design: design guide `UI.JPEG` e wireframe `Wire.JPEG` fornecidos no enunciado; leitura documentada em [`docs/PROTOTIPO.md`](docs/PROTOTIPO.md).
