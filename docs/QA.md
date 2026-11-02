# QA — roteiro executado e resultados

**Data da execução:** 02/11/2026
**Ambiente:** Windows, Node.js, Vite 7.3.7, Chrome (headless via Puppeteer), API Frankfurter ao vivo.
**Build:** `npm run build` concluído sem erros.

Ferramentas de teste usadas fora do repositório (scripts temporários em
`%LOCALAPPDATA%\Temp\opencode\imgtool`): Puppeteer dirigindo o Chrome do
sistema, com captura de console, requisições, downloads e screenshots.

---

## 1. Build

```
vite v7.3.7 building client environment for production...
✓ 90 modules transformed.
dist/index.html                 0.98 kB │ gzip:  0.53 kB
dist/assets/index-*.css        24.38 kB │ gzip:  5.63 kB
dist/assets/index-*.js        279.93 kB │ gzip: 88.26 kB
✓ built in 1.07s
```

Nenhum aviso de import quebrado, variável ausente ou prop inválida.

---

## 2. Conversor

| Caso | Entrada | Resultado observado | Veredito |
| --- | --- | --- | --- |
| Estado inicial | `1000`, BRL→USD | `US$ 183,90`, taxa `1 BRL = 0,183900 USD`, cotação de 02/11/2026 | OK |
| Campo vazio | `` | "Informe um valor para converter.", `aria-invalid=true`, saída `—`, tabela `—` | OK |
| Letras | `abc` | valor higienizado para vazio e mesma mensagem de obrigatório | OK |
| Zero | `0` | "Use um número maior que zero, como 1.000,00." | OK |
| Acima do limite | `9999999999` | "O valor máximo é 1.000.000.000." | OK |
| Milhar + decimal pt-BR | `1.234,56` | `US$ 227,04`, tabela recalculada, sem erro | OK |
| Decimal simples | `250,75` | `US$ 46,11` | OK |
| Troca | botão "Trocar" | BRL→USD vira USD→BRL; taxa `1 USD = 5,4378 BRL` | OK |
| Exclusão da moeda oposta | após troca | origem não lista BRL; destino não lista USD | OK |
| Cotação/data | carregamento | linha "Atualizando cotação…" e depois taxa + data com ícone | OK |

Erros ligados ao campo por `aria-describedby="amount-error"` e `role="alert"`;
o botão de troca fica desabilitado enquanto a taxa carrega.

---

## 3. Gráfico histórico

Intervalos verificados (janela fechada, hoje = 02/11/2026):

| Período | Intervalo exibido | Série |
| --- | --- | --- |
| 7D | 27/10/2026 — 02/11/2026 | 5 cotações úteis |
| 15D | 19/10/2026 — 02/11/2026 | 11 cotações úteis |
| 30D | 04/10/2026 — 02/11/2026 | 22 cotações úteis |
| 3M | 05/08/2026 — 02/11/2026 | 64 cotações úteis |
| 6M | 07/05/2026 — 02/11/2026 | 128 cotações úteis |
| 1A | 03/11/2025 — 02/11/2026 | reduzida para 220 pontos plotados |
| 5A | 04/11/2021 — 02/11/2026 | reduzida para 220 pontos plotados |
| 10A | 05/11/2016 — 02/11/2026 | reduzida para 220 pontos plotados |

Resumo de 7D observado: atual `5,4378`, mínima `5,3271`, máxima `5,5884`,
média `5,4141`, variação `-2,69%`. Resumo de 1A: atual `5,4378`, mínima
`4,9019`, máxima `5,5884`, média `5,1881`, variação `+1,06%`.

| Verificação | Resultado |
| --- | --- |
| Troca de período atualiza aba (`aria-pressed`), intervalo, linha e resumo | OK |
| Tooltip por ponteiro | "21 DE OUT. DE 2026 · 1 BRL = 0,199070 USD" |
| Foco por teclado no SVG (`tabIndex=0`) | OK |
| Setas/Home/End | alteram o ponto ativo e anunciam em `aria-live` |
| Skeleton durante carregamento | OK |
| Estado de erro + "Tentar novamente" | OK (simulado) |
| Estado vazio | OK (mensagem orienta aumentar o período) |

---

## 4. Tabela, busca e ordenação

| Caso | Resultado |
| --- | --- |
| Carga inicial | 29 linhas (30 moedas da API menos a base BRL), contagem "29 moedas" |
| Busca `euro` | 1 linha (EUR), contagem "1 moeda" (singular correto) |
| Busca `dolar` (sem acento) | 6 linhas: AUD, CAD, HKD, NZD, SGD, USD |
| Busca `zzzz` | 0 linhas, "Nenhuma moeda encontrada", botão CSV desabilitado |
| Limpar busca | volta a 29 linhas e 29 moedas |
| Ordenar por código | 1º clique: `ZAR` (`aria-sort="descending"`); 2º: `AUD` (`ascending`) |
| Ordenar por taxa | maior primeiro: `IDR` (18.136,00); menor por último |
| Ordenar por nome | `localeCompare` no idioma ativo |
| Select de ordenação (≤760px) | reflete e altera a mesma ordenação |
| "Usar" em uma linha | define a moeda como destino (`IDR`), marca "Selecionada" e rola ao conversor |
| Valor convertido por linha | recalculado com o valor do conversor (inclusive `—` quando inválido) |

A busca é local (sem requisição) e usa `normalize('NFD')` para ignorar acentos,
tanto no nome da API quanto no nome localizado.

---

## 5. CSV

| Verificação | Resultado |
| --- | --- |
| Clique em "Exportar CSV" | download iniciado |
| Nome do arquivo | `hermes-USD-IDR-2026-11-02.csv` |
| Toast | "CSV exportado com 29 linhas." (`role="status"`) |
| Conteúdo | BOM UTF-8, cabeçalho `Data;Moeda base;Moeda de destino;Nome;Taxa;Valor convertido`, `;`, CRLF, datas ISO, ponto decimal |
| Exporta somente linhas visíveis | sim (após filtro/ordenação) |
| Busca sem resultado | botão desabilitado; nenhum arquivo vazio é gerado |

---

## 6. Idiomas

| Idioma | `<html lang>` | Título | Conversor | Gráfico | Tabela | Botão CSV |
| --- | --- | --- | --- | --- | --- | --- |
| PT | `pt-BR` | Câmbio com clareza | CONVERSOR DE MOEDAS | GRÁFICO HISTÓRICO | TABELA DE COTAÇÕES | Exportar CSV |
| EN | `en` | Exchange rates, clearly | CURRENCY CONVERTER | HISTORICAL CHART | RATES TABLE | Export CSV |
| ES | `es` | El cambio, con claridad | CONVERSOR DE MONEDAS | GRÁFICO HISTÓRICO | TABLA DE COTIZACIONES | Exportar CSV |

A troca não recarrega a página, mantém valor/par/período e persiste em
`localStorage` (`hermes.locale`). Números e datas mudam de formato junto
(`1.234,56` ↔ `1,234.56`).

---

## 7. Responsividade

Medições no DOM (Chrome headless):

| Viewport | `scrollWidth` | Overflow horizontal | Tabela | Altura da página |
| --- | --- | --- | --- | --- |
| 1440 × 900 | 1440 | não | `<table>` | 2251px |
| 834 × 1112 | 834 | não | `<table>` | 2600px |
| 390 × 844 | 390 | não | cartões (`display: block` / `grid`) | 7565px |

- Nenhum elemento com `overflow-x: visible` ultrapassa o container.
- Nenhum conteúdo cortado por `overflow: hidden` (exceto textos `.sr-only`,
  intencionais).
- Alvos de toque: todos ≥ 34px, exceto o link de texto no rodapé (link inline).
- Conversor empilha em ≤860px; barra da tabela mostra o select de ordenação em
  ≤760px; cabeçalho compacta em ≤720px.

Capturas: `desktop.png`, `tablet.png`, `mobile.png`, `mobile-converter.png`,
`mobile-table-row.png`.

---

## 8. Falha total da API (simulada)

Requisições para `api.frankfurter.dev` abortadas via DevTools:

| Cartão | Mensagem | Ação |
| --- | --- | --- |
| Conversor | "Não foi possível carregar a lista de moedas." + "Não foi possível carregar a cotação deste par." | 2 botões "Tentar novamente" |
| Gráfico | "Não foi possível carregar" / "Verifique sua conexão e tente novamente." | "Tentar novamente" |
| Tabela | mesma mensagem | "Tentar novamente" |

Nenhuma tela branca, nenhum erro não tratado no console. Captura:
`docs/evidence/estado-erro.png`.

---

## 9. Console e rede

- **Erros de console:** 0 nas execuções finais.
- **Requisições:** `/currencies` (1×), `/latest?base=BRL` (1× por base),
  `/{inicio}..{fim}` (1× por par/período). Trocar apenas a moeda de destino não
  refaz `/latest`; buscar/ordenar não faz requisição.
- O Puppeteer registra `requestfailed` nas primeiras requisições por causa do
  `StrictMode` do React 19, que monta/desmonta efeitos duas vezes em
  desenvolvimento e aborta a duplicata. Os dados carregam normalmente e o build
  de produção não duplica chamadas.

---

## 10. Como reproduzir

1. `npm install && npm run dev`.
2. Abra `http://localhost:5173`.
3. Siga as tabelas acima na ordem.
4. Para o estado de erro, use DevTools → Network → bloqueie
   `api.frankfurter.dev` e recarregue.
5. Para o build: `npm run build` e confira `dist/`.
