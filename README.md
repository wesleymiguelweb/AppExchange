# Hermes · Câmbio com clareza

SPA responsiva para conversão de moedas e análise histórica. A direção visual usa as imagens compartilhadas como inspiração: dashboard claro, cartões arredondados, gráficos compactos e um cartão de destaque em gradiente. O conteúdo foi adaptado para câmbio.

## Executar localmente

Requisitos: Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite. Para gerar a versão de produção, rode `npm run build`; `npm run preview` permite visualizar o conteúdo gerado.

## Estrutura

- `src/App.jsx`: composição do painel e estado compartilhado do conversor.
- `src/components/`: cartões funcionais, gráfico SVG, ícones e controle do tema.
- `src/hooks/`: lista de moedas, consulta de câmbio, busca com debounce e tema persistente.
- `src/services/frankfurter.js`: chamadas HTTP isoladas para a API.
- `src/utils/`: formatação de números/datas e geração do CSV.
- `src/styles/global.css`: entrada Tailwind, variante dark, animação do gráfico e estilos base.
- `src/main.jsx`: inicialização React e importação dos estilos.

Tailwind CSS v4 com o plugin oficial para Vite foi escolhido para compor o layout com utilitários responsivos diretamente nos componentes. O gráfico SVG mantém regras específicas próprias; o seletor `data-theme` ativa a variante `dark` e o tema fica salvo no navegador.

O botão de tema alterna entre claro e escuro e salva a escolha em `localStorage`; na primeira visita, a preferência do sistema é usada. O gráfico apresenta a série histórica diária, com tooltip por cursor e navegação por teclado. A consulta renova automaticamente a cada minuto.

## Dados de câmbio

O painel usa `fetch` e `async/await` para consultar `https://api.frankfurter.dev/v1/currencies`, `/latest?base={moeda}&symbols={destino}` e `/{data inicial}..{data final}?base={moeda}&symbols={destino}`. A API Frankfurter v1 está depreciada, mas segue funcionando. As taxas são referências diárias, não cotações em tempo real. Se a lista de moedas falhar, a interface mantém uma lista inicial reduzida e informa falhas nas consultas de câmbio.

O período histórico é selecionado na barra superior. O conversor recalcula o valor localmente a partir da taxa recebida. A lista de moedas oferece busca com debounce, ordenação por código, nome e cotação, além de paginação. As taxas por moeda são carregadas em relação à moeda base. A exportação CSV é gerada por uma utilidade reutilizável no navegador e inclui data, par, taxa e valores. O gráfico SVG permite explorar os pontos com o cursor ou as setas do teclado. A tela atualiza a consulta a cada minuto, mas a série permanece diária porque essa é a frequência da fonte.

## React aplicado

Componentes funcionais e JSX compõem a página. `useState` mantém valor, par de moedas, período, dados e mensagens. Os campos e botões são controlados por eventos React; estado compartilhado fica no componente principal (lifting state up). `useEffect` carrega moedas e atualiza taxa e série histórica quando o par ou período muda. `useMemo` filtra e ordena a lista de moedas. `MiniLine` recebe dados por props e desenha as séries em SVG.

## Explicação técnica do fluxo

### Consumo da API

As chamadas estão isoladas em `src/services/frankfurter.js`. `request` usa `fetch` com `async/await`, valida o status HTTP e converte a resposta JSON. O `AbortSignal` permite cancelar uma consulta se o usuário trocar o par antes da resposta chegar.

Exemplo de taxa atual para o conversor:

```js
export function getLatestRate(base, quote, signal) {
  return request(
    `/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quote)}`,
    signal,
  );
}
```

O hook `useMarketData` chama a cotação atual e a série histórica em paralelo. Ele valida os números, organiza os pontos por data e calcula mínima, máxima, média e variação. Se o histórico falhar, a cotação atual ainda pode alimentar o conversor.

### Conversão e estado React

`App.jsx` mantém `base`, `quote`, `amount` e `days` com `useState`. Esse lifting state up mantém conversor, gráfico, métricas e lista alinhados. Os cartões recebem valores e callbacks por props; inputs e selects usam `value`/`onChange`, então são controlados pelo React.

`useCurrencies`, `useMarketData`, `useLatestRates`, `useDebounce`, `useTheme` e `useCurrentTime` isolam carregamento, busca e preferências. Os `useEffect` fazem as consultas ao montar ou quando o par/período muda e limpam timers ou requisições no unmount.

### Gráfico, filtros e paginação

`CurrencyChart` recebe a série via props e desenha uma linha SVG com pontos calculados a partir das datas e taxas. O ponteiro seleciona o ponto mais próximo; o mesmo controle aceita setas do teclado. A lista filtra por código/nome, ordena por código, nome ou taxa e fatia o resultado em páginas de oito moedas. Esses dados são transformações de arrays, sem alterar o estado original.

### Exportação CSV

`src/utils/exportCsv.js` recebe um registro de conversão, monta cabeçalho e valores, escapa aspas e usa `;` como separador. O BOM UTF-8 ajuda planilhas configuradas em pt-BR. O arquivo é criado com `Blob` e uma URL temporária do navegador:

```js
const csv = `\uFEFF${rows
  .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';'))
  .join('\r\n')}`;
const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
link.href = url;
link.download = `cambio-${base}-${quote}.csv`;
link.click();
```

Após o início do download, a URL temporária é revogada para liberar memória. A função é reutilizável e não depende de bibliotecas de CSV.

## Git e publicação no GitHub

```bash
git init
git add .
git commit -m "feat: adicionar painel de conversão de moedas"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Mensagens de commit sugeridas:

- `feat: adicionar conversor de moedas`
- `feat: implementar análise histórica`
- `feat: adicionar exportação CSV`
- `fix: tratar falhas da API de câmbio`
