

## 1. Base do projeto

| --- | --- | --- | --- |
| 1.1 | React + Vite, JavaScript moderno | React 19, Vite 7, ES Modules e JSX | `package.json`, `vite.config.js`, `src/main.jsx` |
| 1.2 | Componentes funcionais e reutilizáveis | Componentes por domínio (`ui`, `layout`, `chart`, `converter`, `rates`, `portfolio`, `overlays`) | `src/components/**` |
| 1.3 | JSX | Toda a árvore de UI é JSX, inclusive os gráficos SVG | `src/App.jsx`, `src/components/chart/RateChart.jsx` |
| 1.4 | Estrutura de pastas | `components`, `context`, `hooks`, `services`, `utils`, `styles`, `constants`, `i18n`, `views`, `docs` | árvore no `README.md §4` |
| 1.5 | CSS com escopo | CSS Modules + tokens; Tailwind v4 incremental para utilitários | `*.module.css`, `src/styles/tokens.css`, `src/styles/tailwind.css` |
| 1.6 | Sem bibliotecas de gráfico/CSV | SVG desenhado à mão; CSV com `Blob`/`URL` | `RateChart.jsx`, `ValueChart.jsx`, `src/utils/csv.js` |
| 1.7 | Sem chave de API | Frankfurter é pública | `src/services/frankfurterApi.js` |

## 2. Componentes, props e eventos

| --- | --- | --- | --- |
| 2.1 | Props | Views, painéis, modais e UI recebem dados e callbacks por props | `src/views/**`, `src/components/**` |
| 2.2 | Validação de props | `propTypes` nos componentes públicos | `PositionModal.jsx`, `EntriesTable.jsx`, `RateChart.jsx`, `DashboardPanels.jsx` |
| 2.3 | Composição | `Card`, `Panel`, `Field`, `Button` e `Modal` reutilizados | `src/components/ui/**` |
| 2.4 | Eventos de clique | Troca, períodos, ordenação, CSV, filtros, menus, modais e painéis | `ConverterCard.jsx`, `PeriodTabs.jsx`, `PortfolioView.jsx`, `DashboardView.jsx` |
| 2.5 | Eventos de teclado | Setas/Home/End no gráfico; `Esc` em modais; `Ctrl+K`/`/` na busca | `RateChart.jsx`, `Modal.jsx`, `App.jsx` |
| 2.6 | Eventos de ponteiro | Crosshair/tooltip no gráfico, drag-and-drop dos painéis, tilt cards | `RateChart.jsx`, `DashboardView.jsx`, `TiltCard.jsx` |
| 2.7 | Inputs controlados | Valor, busca, selects, quantidade, preço, taxa, data e tema | `ConverterCard.jsx`, `PositionModal.jsx`, `TradeView.jsx` |

## 3. Estado e contexto


| --- | --- | --- | --- |
| 3.1 | `useState` | Valor, par, período, busca, ordenação, tema, fonte, modais e formulários | `App.jsx`, `TradeView.jsx`, `PositionModal.jsx`, `SettingsView.jsx` |
| 3.2 | **Lifting State Up** | `App` centraliza par e modais; `MarketDataProvider` centraliza taxas; `PortfolioProvider` centraliza movimentações | `src/App.jsx`, `src/context/MarketDataContext.jsx`, `src/context/PortfolioContext.jsx` |
| 3.3 | Estado derivado sem duplicação | Valor convertido, linhas, totais e séries calculados com `useMemo` | `src/utils/portfolio.js`, `src/utils/entries.js` |
| 3.4 | Sem globais mutáveis | Persistência encapsulada em hooks/contextos; caches por instância | `src/hooks/useLocalStorageState.js`, `src/context/**` |
| 3.5 | Contextos | `MarketData`, `Portfolio`, `Panels`, `Toast`, `UIContext` e `I18n` | `src/context/**`, `src/i18n/I18nProvider.jsx` |

## 4. Efeitos e hooks customizados

| --- | --- | --- | --- |
| 4.1 | `useEffect` com limpeza | Aborta requisições, limpa timers, desconecta `ResizeObserver` e restaura overflow | `useCurrencies.js`, `useHistoricalRates.js`, `useToast.js`, `useElementWidth.js`, `AppShell.jsx` |
| 4.2 | Dados de câmbio | `useCurrencies`, `useLatestRates`, `useExchangeRate` | `src/hooks/` |
| 4.3 | Histórico | `useHistoricalRates`, `useMarketSeries`, `usePortfolioHistory` | `src/hooks/` |
| 4.4 | Persistência | `useLocalStorageState` com chave versionada | `src/hooks/useLocalStorageState.js` |
| 4.5 | Preferências | `useTheme`, `useFont`, `I18nProvider` | `src/hooks/useTheme.js`, `src/hooks/useFont.js` |
| 4.6 | Regras dos hooks | Hooks sempre no topo, dependências explícitas e cleanup em todo efeito | `src/hooks/**` |

## 5. API, assincronismo e erros

| --- | --- | --- | --- |
| 5.1 | Chamadas isoladas | Só `services/http.js` conhece `fetch` | `src/services/http.js` |
| 5.2 | `fetch` + `async/await` | `fetchJson` com timeout, JSON validado e erros normalizados | `http.js` |
| 5.3 | Erros HTTP/rede | `ApiError` com `type` (`network`, `http`, `invalid`, `timeout`) | `http.js`, `errorMessages.js` |
| 5.4 | Cancelamento | Requisição anterior abortada ao trocar par/período/base | `useHistoricalRates.js`, `useLatestRates.js`, `useMarketSeries.js` |
| 5.5 | Evitar requisições | Uma chamada por base compartilhada; busca/ordenação no cliente | `MarketDataContext.jsx`, `TradeView.jsx` |
| 5.6 | Sem segredos | Nenhum `.env` ou token versionado | `.gitignore`, `frankfurterApi.js` |

## 6. Carteira: entradas e saídas

| --- | --- | --- | --- |
| 6.1 | Registro de entrada | Formulário com moeda, quantidade, data, preço e custos | `PositionModal.jsx` |
| 6.2 | Registro de saída | Mesmo formulário com validação de saldo e preço de resgate | `PositionModal.jsx`, `entryErrors.insufficient` |
| 6.3 | Várias entradas por moeda | Histórico da posição guarda cada movimentação individualmente | `PortfolioContext.jsx`, `entries.js` |
| 6.4 | Preços diferentes | Cada entrada grava seu próprio preço em BRL; custo médio é ponderado | `entries.js` (`summarizeEntries`) |
| 6.5 | Cotação atual | Preço em branco captura a cotação do dia; botão “Cotação de hoje” | `parseEntryInput`, `priceInBrl` |
| 6.6 | Histórico | Tabela compartilhada na carteira e no detalhe do ativo | `EntriesTable.jsx`, `PortfolioView.jsx`, `AssetDetailModal.jsx` |
| 6.7 | Persistência/migração | v3 atual; migra v2 (compra/venda) e v1 (quantidade + custo médio) | `PortfolioContext.jsx` |
| 6.8 | Moeda base | Preço sempre em BRL; trocar a base não corrompe o custo | `priceInBrl`, README §5 |
| 6.9 | Exportação | CSV da carteira e CSV do histórico | `PortfolioView.jsx` |

## 7. Funcionalidades por tela

| --- | --- | --- | --- |
| 7.1 | Dashboard | Patrimônio, custo, resultado, gráfico 7/30/90D, performance, alocação, posições, watchlist e insights | `DashboardView.jsx`, `DashboardPanels.jsx` |
| 7.2 | Dashboard editável | Ocultar, redimensionar, reordenar por drag-and-drop e teclado; reset | `PanelsContext.jsx`, `DashboardView.jsx` |
| 7.3 | Carteira | Busca, ordenação, paginação, peso, P&L, ações e histórico | `PortfolioView.jsx` |
| 7.4 | Mercado | Busca, ordenação, cartões/lista, sparklines e detalhe do ativo | `MarketsView.jsx`, `AssetDetailModal.jsx` |
| 7.5 | Câmbio | Conversor, oito períodos, gráfico SVG, resumo, tabela e CSV | `TradeView.jsx`, `ConverterCard.jsx`, `ChartCard.jsx`, `RatesCard.jsx` |
| 7.6 | Ajustes | Tema, idioma, fonte, moeda base, carteira e painéis | `SettingsView.jsx` |
| 7.7 | Suporte | FAQ, atalhos, mapa e fonte | `SupportView.jsx` |
| 7.8 | Busca global | Páginas, moedas e ações com teclado | `SearchPalette.jsx` |
| 7.9 | Estados | Loading, erro com retry, vazio e sucesso | `StateBlock.jsx`, `ChartCard.jsx`, `Toast.jsx` |

## 8. Formatação, idioma e acessibilidade

| --- | --- | --- | --- |
| 8.1 | Números/datas | `Intl.NumberFormat`/`DateTimeFormat` por locale | `src/utils/format.js` |
| 8.2 | Percentual com sinal | `signDisplay: 'exceptZero'` | `format.js` |
| 8.3 | Nome da moeda | `Intl.DisplayNames` com fallback da API | `format.js` |
| 8.4 | Três idiomas | PT-BR, EN e ES com interpolação e persistência | `src/i18n/**` |
| 8.5 | Labels e erros | `<label for>`, `role="alert"`, `aria-invalid` e `aria-describedby` | `Field.jsx`, `PositionModal.jsx` |
| 8.6 | Foco e teclado | `:focus-visible`, foco preso em modais, skip link e atalhos | `global.css`, `Modal.jsx`, `App.jsx` |
| 8.7 | Gráfico acessível | SVG com `role="img"`, descrição, pontos navegáveis e `aria-live` | `RateChart.jsx` |
| 8.8 | Tabelas | `caption`, `scope` e `aria-sort` | `RatesTable.jsx`, `EntriesTable.jsx` |
| 8.9 | Movimento reduzido | `prefers-reduced-motion` em animações e rolagem | `global.css`, `tailwind.css` |
| 8.10 | Contraste | Tokens HERMES com texto principal ~13:1 | `tokens.css` |

## 9. Entrega

| --- | --- | --- | --- |
| 9.1 | `package.json` | Scripts `dev`, `build`, `preview`; engines Node | `package.json` |
| 9.2 | README | Instalação, estrutura, modelo da carteira, API, decisões, Git e verificação | `README.md` |
| 9.3 | `.gitignore` | `node_modules`, `dist`, env, logs e editores | `.gitignore` |
| 9.4 | Git/GitHub | Repositório público e histórico convencional | `docs/COMMITS.md` |
| 9.5 | Postman | Três requisições com testes e variáveis | `postman/Hermes-Frankfurter.postman_collection.json` |
| 9.6 | Evidências visuais | Desktop, mobile, menus, carteira, mercados, suporte e modais | `docs/evidence/` |
| 9.7 | Checklist | Este documento | `docs/CHECKLIST.md` |
| 9.8 | Trechos de código | Snippets comentados por tópico | `docs/EVIDENCE.md` |
| 9.9 | Build funcional | `npm run build` sem erros | `dist/`, `docs/QA.md` |

## 10. Itens fora do escopo (conscientes)

| Item | Situação |
| --- | --- |
| Testes unitários (Vitest/Jest) | Não solicitados; QA manual/automatizado em `docs/QA.md`. |
| Backend próprio | A fonte é pública e não exige proxy. |
| Gráfico intradiário | A Frankfurter só publica taxas diárias. |
| Sincronização entre dispositivos | A carteira é local ao navegador por decisão de escopo. |
| Autenticação | Não há login; todos os dados são locais. |
