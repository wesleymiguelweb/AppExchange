# Checklist de requisitos → evidência no código

Mapa item a item entre o enunciado do trabalho e o código entregue. Todos os
itens estão **atendidos**; a coluna "Evidência" aponta arquivo e linha (o número
pode variar em poucas linhas após formatação, mas o símbolo citado é único).

## 1. Base do projeto

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 1.1 | React + Vite, JavaScript moderno | React 19, Vite 7, ES Modules, JSX | `package.json`, `vite.config.js`, `src/main.jsx:1-17` |
| 1.2 | Componentes funcionais e reutilizáveis | 24 componentes divididos por domínio; nenhum componente de classe exceto o error boundary | `src/components/**` |
| 1.3 | JSX | Toda a árvore de UI é JSX, inclusive SVG | `src/App.jsx:132-221`, `src/components/chart/RateChart.jsx:96-196` |
| 1.4 | Estrutura de pastas pedida | `components`, `hooks`, `services`, `utils`, `assets`→`styles` (tokens/global), `constants`, `i18n`, `docs` | árvore no `README.md §4`; `src/styles/` |
| 1.5 | CSS com escopo | CSS Modules + tokens CSS; justificativa no README | `*.module.css`, `src/styles/tokens.css` |
| 1.6 | Sem bibliotecas de gráfico/CSV | SVG desenhado à mão e CSV com `Blob`/`URL` | `RateChart.jsx`, `src/utils/csv.js:29-43` |
| 1.7 | Sem chave de API | Frankfurter é pública | `src/services/frankfurterApi.js:3` |

## 2. Componentes, props e eventos

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 2.1 | Props | Conversor, gráfico, tabela e UI recebem dados e callbacks por props | `src/App.jsx:158-204` |
| 2.2 | Validação simples de props | `propTypes` em todos os componentes públicos | `ConverterCard.jsx:223-245`, `RateChart.jsx:201-213`, `RatesCard.jsx:134-151` |
| 2.3 | Composição | `Card` + `Field` + `Button` reutilizados nos três cartões | `src/components/ui/Card.jsx:5-25`, `Field.jsx:5-30` |
| 2.4 | Eventos de clique | Troca, períodos, ordenação, "Usar", CSV, idioma | `ConverterCard.jsx:98`, `PeriodTabs.jsx:14`, `RatesTable.jsx:20`, `TableToolbar.jsx:95`, `LanguageSwitcher.jsx:19` |
| 2.5 | Eventos de teclado | Setas/Home/End no gráfico | `RateChart.jsx:72-89` |
| 2.6 | Eventos de ponteiro | Crosshair e tooltip seguem o mouse/dedo | `RateChart.jsx:65-70` |
| 2.7 | Inputs controlados | `value` + `onChange` no valor, busca, selects e ordenação mobile | `ConverterCard.jsx:55-68`, `TableToolbar.jsx:38-50`, `CurrencySelect.jsx:24-34` |

## 3. Estado

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 3.1 | `useState` | Valor, origem, destino, período, busca, ordenação, tooltip, idioma, toast | `App.jsx:25-28`, `RatesCard.jsx:35-36`, `RateChart.jsx:19`, `I18nProvider.jsx:42` |
| 3.2 | **Lifting State Up** | `App` é a única fonte de verdade de valor, par e período; os cartões só recebem props e emitem eventos | `App.jsx:22-36`, comentário `App.jsx:22-24`; passagem em `App.jsx:158-204` |
| 3.3 | Estado derivado sem duplicação | Valor convertido, linhas da tabela e resumo são calculados com `useMemo` | `App.jsx:38-66` |
| 3.4 | Sem globais mutáveis | Formatação e i18n encapsulados em provider/hook; caches locais por instância | `src/utils/format.js:15-25`, `I18nProvider.jsx:57-68` |

## 4. Efeitos e hooks customizados

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 4.1 | `useEffect` com limpeza | Aborta requisições, limpa timers e desconecta `ResizeObserver` | `useCurrencies.js:15-29`, `useHistoricalRates.js:18-45`, `useDebouncedValue.js:7-10`, `useElementWidth.js:11-30` |
| 4.2 | `useCurrencies` | Lista de moedas + retry | `src/hooks/useCurrencies.js:11-34` |
| 4.3 | `useExchangeRate` | Deriva a taxa do par a partir do mapa de taxas | `src/hooks/useExchangeRate.js:7-16` |
| 4.4 | `useHistoricalRates` | Série do período, dependente de par + dias | `src/hooks/useHistoricalRates.js:12-50` |
| 4.5 | `useDebounce` | `useDebouncedValue` aplicado à busca | `src/hooks/useDebouncedValue.js:4-13`, `RatesCard.jsx:37` |
| 4.6 | Hooks extras | `useLatestRates`, `useToast`, `useElementWidth` | `src/hooks/` |
| 4.7 | Regras dos hooks | Hooks sempre no topo, dependências explícitas, cleanup em todo efeito | todos os arquivos de `src/hooks/` |
| 4.8 | Contexto | `I18nProvider` + `useI18n` com erro se usado fora do provider | `src/i18n/I18nProvider.jsx:9-71`, `useI18n.js:5-11` |

## 5. API, assincronismo e erros

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 5.1 | Chamadas isoladas em serviço | Só `services/http.js` conhece `fetch` | `src/services/http.js:28-76` |
| 5.2 | `fetch` + `async/await` | `fetchJson` assíncrono com timeout e JSON validado | `http.js:40-64` |
| 5.3 | Erros HTTP | `!response.ok` → `ApiError` com status | `http.js:46-51` |
| 5.4 | Erros de rede | Exceções de `fetch` normalizadas | `http.js:65-71` |
| 5.5 | Resposta inválida/vazia | JSON inválido, não-objeto, `rates` ausente e lista vazia | `http.js:53-62`, `frankfurterApi.js:5-11,35-37` |
| 5.6 | Timeout | 12s com `AbortController` | `http.js:1,29-33` |
| 5.7 | Cancelamento | Requisição anterior abortada ao trocar par/período/base | `useHistoricalRates.js:24-45`, `useLatestRates.js:24-38` |
| 5.8 | Evitar requisições desnecessárias | Uma chamada por base compartilhada entre conversor e tabela; busca/ordenação no cliente | `App.jsx:34-36`, `useLatestRates.js:5-8` |
| 5.9 | Nenhuma chave/segredo | Nenhum `.env` ou token | `.gitignore`, `frankfurterApi.js` |

## 6. Manipulação de arrays e objetos

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 6.1 | Objeto → array | `Object.entries(rates)` vira linhas da tabela | `App.jsx:53-64` |
| 6.2 | `map` | Moedas, pontos, opções de select, linhas, colunas CSV | `frankfurterApi.js:30-33`, `RateChart.jsx:26`, `RatesTable.jsx:77` |
| 6.3 | `filter` | Remove moeda oposta, taxas inválidas e busca vazia | `CurrencySelect.jsx:20`, `App.jsx:57`, `RatesCard.jsx:44-47` |
| 6.4 | `sort` | Código, nome (locale) e taxa | `RatesCard.jsx:52-61`, `frankfurterApi.js:76` |
| 6.5 | `reduce` | Média e acesso por caminho no i18n | `series.js:20`, `I18nProvider.jsx:12` |
| 6.6 | Spread/desestruturação | Estado imutável e props | `RatesCard.jsx:52`, `App.jsx:56-63` |
| 6.7 | `Map` para lookup | Nome por código em O(1) | `App.jsx:47-51` |

## 7. Funcionalidades da tela

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 7.1 | Valor, origem/destino | Campos controlados, selects nativos | `ConverterCard.jsx:42-148` |
| 7.2 | Taxa atual + data | Linha "1 BRL = …" com data da cotação | `ConverterCard.jsx:166-199` |
| 7.3 | Valor convertido | `<output aria-live>` recalculado | `App.jsx:41-44`, `ConverterCard.jsx:106-128` |
| 7.4 | Troca de moedas | Inverte origem/destino | `App.jsx:72-75`, `ConverterCard.jsx:90-103` |
| 7.5 | Validação | Vazio, inválido, zero, acima do limite | `validation.js:11-31`, `ConverterCard.jsx:52-73` |
| 7.6 | Histórico 7/30/90/1 ano+ | 8 períodos, incluindo 7D, 30D, 3M (90d) e 1A/5A/10A | `constants/periods.js:5-14` |
| 7.7 | Gráfico de linha | SVG com eixos, grade, área, linha e ponto final | `RateChart.jsx:96-196` |
| 7.8 | Resumo do período | Atual, mínima, máxima, média, variação % | `PeriodSummary.jsx:6-37`, `series.js:12-33` |
| 7.9 | Estados de carga/erro/vazio | Skeleton, erro com retry, vazio com mensagem | `StateBlock.jsx:10-63`, `ChartCard.jsx:41-70` |
| 7.10 | Busca por código/nome | Sem acento (`normalize("NFD")`) e por nome localizado | `RatesCard.jsx:14-20,40-49` |
| 7.11 | Ordenação | Cabeçalho clicável + select no mobile | `RatesTable.jsx:8-35`, `TableToolbar.jsx:7-14,66-84` |
| 7.12 | Selecionar moeda na tabela | Define destino e rola ao conversor | `App.jsx:77-85`, `RatesTable.jsx:118-135` |
| 7.13 | Vazio da tabela | Mensagem com o termo buscado e contagem zerada | `RatesCard.jsx:108-118`, `translations.js:96` |
| 7.14 | CSV sem biblioteca | Colunas, escape RFC 4180, BOM, `;`, ISO | `utils/csv.js:1-26` |
| 7.15 | Feedback do CSV | Toast de sucesso com contagem e toast de erro | `App.jsx:87-130`, `Toast.jsx:6-40` |
| 7.16 | Exporta o que está visível | CSV recebe as linhas filtradas/ordenadas | `RatesCard.jsx:98`, `App.jsx:88-92` |

## 8. Formatação, idioma e protótipo

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 8.1 | Números/datas pt-BR | `Intl.NumberFormat`/`DateTimeFormat` por locale | `utils/format.js:15-124` |
| 8.2 | Percentual com sinal | `signDisplay: 'exceptZero'` | `format.js:29-34` |
| 8.3 | Nome da moeda localizado | `Intl.DisplayNames` com fallback da API | `format.js:49-54,110-122` |
| 8.4 | Fidelidade ao protótipo | Tokens HERMES, 3 cartões full-width, 8 períodos, hierarquia e espaçamento | `styles/tokens.css`, `docs/PROTOTIPO.md` |
| 8.5 | Sem seções inventadas | Apenas cabeçalho, título, conversor, histórico, tabela/filtros/CSV e rodapé | `App.jsx:132-221` |
| 8.6 | Estados visuais | hover/focus/loading/error/empty/success | CSS Modules + `StateBlock` + `Toast` |
| 8.7 | Responsivo | 3 breakpoints principais + tabela em cartões | `App.module.css`, `ConverterCard.module.css`, `RatesTable.module.css:150-230` |
| 8.8 | Decisões ambíguas documentadas | Protótipo, períodos, CSV e ação da linha | `docs/PROTOTIPO.md §5`, README §6 |

## 9. Acessibilidade

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 9.1 | Labels ligados aos campos | `<label htmlFor>` em todos os inputs/selects | `Field.jsx:11-13`, `CurrencySelect.jsx:24`, `TableToolbar.jsx:63-65` |
| 9.2 | Erros compreensíveis | Texto específico + `role="alert"` + `aria-describedby` | `Field.jsx:7-30`, `ConverterCard.jsx:64-65` |
| 9.3 | Foco visível | `:focus-visible` global e por componente | `global.css:49-53`, `RateChart.module.css:14-18` |
| 9.4 | Botões desabilitados em request | Swap e selects desabilitados; CSV desabilitado sem linhas | `ConverterCard.jsx:96`, `CurrencySelect.jsx:31`, `TableToolbar.jsx:98` |
| 9.5 | Navegação por teclado | Gráfico, selects nativos, botões e skip link | `RateChart.jsx:106-111`, `App.jsx:134-136` |
| 9.6 | Leitores de tela | `aria-live`, `aria-sort`, caption, `scope`, textos sr-only | `RatesTable.jsx:41-75`, `RateChart.jsx:185-195` |
| 9.7 | Contraste | Ink sobre Paper ≈ 13:1; secundários ≥ 4.5:1 | `tokens.css:6-35` |
| 9.8 | Movimento reduzido | `prefers-reduced-motion` global e rolagem condicional | `global.css:75-83`, `App.jsx:79-84` |

## 10. Entrega

| # | Requisito | Como foi atendido | Evidência |
| --- | --- | --- | --- |
| 10.1 | `package.json` | Scripts `dev`, `build`, `preview`; engines Node | `package.json` |
| 10.2 | README | Instalação, execução, estrutura, API, decisões, Git | `README.md` |
| 10.3 | `.gitignore` | `node_modules`, `dist`, env, logs, editores | `.gitignore` |
| 10.4 | Git init/add/commit/branch/push | Repositório local com histórico convencional + instruções | `docs/COMMITS.md`, README §10 |
| 10.5 | Coleção Postman | 3 requisições com testes e variáveis | `postman/Hermes-Frankfurter.postman_collection.json` |
| 10.6 | Evidências visuais | Desktop, tablet, mobile, cartões, tooltip, vazio e erro | `docs/evidence/` |
| 10.7 | Checklist | Este documento | `docs/CHECKLIST.md` |
| 10.8 | Trechos de código | Snippets comentados por tópico | `docs/EVIDENCE.md` |
| 10.9 | Build funcional | `npm run build` sem erros | `dist/` (gerado), `docs/QA.md §1` |

## 11. Itens fora do escopo (conscientes)

| Item | Situação |
| --- | --- |
| Testes unitários (Vitest/Jest) | Não solicitados; QA manual/automatizado documentado em `docs/QA.md`. |
| Backend próprio | A fonte é pública e não exige proxy. |
| Gráfico intradiário | A Frankfurter só publica taxas diárias. |
| Tema escuro | Não existe no design guide HERMES; não foi inventado. |
| Roteamento / múltiplas páginas | O wireframe é uma única página. |
