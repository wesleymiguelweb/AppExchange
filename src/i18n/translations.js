import { riaTranslations } from './riaTranslations.js';

export const DEFAULT_LOCALE = 'pt-BR';

export const LOCALES = [
  { id: 'pt-BR', short: 'PT', label: 'Português (Brasil)' },
  { id: 'en', short: 'EN', label: 'English' },
  { id: 'es', short: 'ES', label: 'Español' },
];

const PERIOD_KEYS = {
  '7D': '7d',
  '15D': '15d',
  '30D': '30d',
  '3M': '3m',
  '6M': '6m',
  '1A': '1a',
  '5A': '5a',
  '10A': '10a',
};

export const translations = {
  'pt-BR': {
    app: { name: 'HERMES', kicker: 'Câmbio' },
    language: { label: 'Idioma' },
    page: {
      eyebrow: 'Cotações de referência · BCE',
      title: 'Câmbio com clareza',
      description:
        'Converta, acompanhe e exporte cotações do Banco Central Europeu. Dados oficiais, sem ruído e sem taxas escondidas.',
    },
    converter: {
      title: 'Conversor de moedas',
      subtitle: 'Taxa de referência do último dia útil',
      from: 'De',
      to: 'Para',
      swap: 'Trocar moedas de origem e destino',
      amountLabel: 'Valor em {currency}',
      outputLabel: 'Valor convertido em {currency}',
      amountErrors: {
        required: 'Informe um valor para converter.',
        invalid: 'Use um número maior que zero, como 1.000,00.',
        tooLarge: 'O valor máximo é 1.000.000.000.',
      },
      rateLine: '1 {from} = {rate} {to}',
      quoteDate: 'Cotação de {date}',
      updating: 'Atualizando cotação…',
      swapShort: 'Trocar',
      hint: 'Taxas de referência do BCE, sem spread comercial.',
    },
    chart: {
      title: 'Gráfico histórico',
      subtitle: '{from} para {to}',
      periodsLabel: 'Período do gráfico',
      periodLabel: 'Últimos {period}',
      periodNames: {
        '7D': '7 dias',
        '15D': '15 dias',
        '30D': '30 dias',
        '3M': '3 meses',
        '6M': '6 meses',
        '1A': '1 ano',
        '5A': '5 anos',
        '10A': '10 anos',
      },
      stats: {
        current: 'Taxa atual',
        min: 'Mínima',
        max: 'Máxima',
        variation: 'Variação',
        average: 'Média',
      },
      loading: 'Carregando série histórica…',
      emptyTitle: 'Sem dados para este período',
      empty: 'A Frankfurter não publicou cotações nos dias selecionados. Tente um período maior.',
      chartLabel:
        'Gráfico de linha da taxa de {from} para {to} entre {start} e {end}. Mínima {min}, máxima {max}.',
      pointLabel: '{date}: {rate}',
      keyboardHint: 'Use as setas para explorar os pontos do gráfico.',
    },
    rates: {
      title: 'Tabela de cotações',
      subtitle: '1 {base} em todas as moedas suportadas',
      subtitleWithDate: '1 {base} em todas as moedas suportadas · {date}',
      searchLabel: 'Buscar moeda por código ou nome',
      searchPlaceholder: 'Buscar por código ou nome…',
      count: '{count} moedas',
      countOne: '{count} moeda',
      columns: {
        code: 'Moeda',
        name: 'Nome',
        rate: 'Taxa',
        converted: 'Valor convertido',
        action: 'Ação',
      },
      use: 'Usar',
      useLabel: 'Usar {code} como moeda de destino',
      emptyTitle: 'Nenhuma moeda encontrada',
      empty: 'Não há resultado para “{query}”. Verifique o código ou o nome.',
      emptyNoData: 'A fonte não retornou cotações para a moeda base selecionada.',
      footnote: 'Cotações relativas a 1 {base}, publicadas em dias úteis.',
      clearSearch: 'Limpar busca',
      sortLabel: 'Ordenar por {column}',
      sortAscending: 'crescente',
      sortDescending: 'decrescente',
      sortMobileLabel: 'Ordenar tabela',
      sortOptions: {
        codeAsc: 'Código (A–Z)',
        codeDesc: 'Código (Z–A)',
        nameAsc: 'Nome (A–Z)',
        nameDesc: 'Nome (Z–A)',
        rateDesc: 'Maior taxa',
        rateAsc: 'Menor taxa',
      },
      selected: 'Selecionada',
    },
    csv: {
      export: 'Exportar CSV',
      exportSeries: 'Exportar série',
      success: 'CSV exportado com {count} linhas.',
      successOne: 'CSV exportado com {count} linha.',
      error: 'Não foi possível gerar o arquivo CSV.',
      empty: 'Não há dados para exportar.',
      headers: {
        date: 'Data',
        base: 'Moeda base',
        target: 'Moeda de destino',
        name: 'Nome',
        rate: 'Taxa',
        converted: 'Valor convertido',
      },
    },
    errors: {
      title: 'Não foi possível carregar',
      network: 'Verifique sua conexão e tente novamente.',
      http: 'O serviço de câmbio respondeu com erro ({status}).',
      invalid: 'O serviço retornou dados inesperados. Tente novamente.',
      generic: 'Algo deu errado ao consultar as cotações.',
      currencies: 'Não foi possível carregar a lista de moedas.',
      rate: 'Não foi possível carregar a cotação deste par.',
      retry: 'Tentar novamente',
      loading: 'Carregando…',
    },
    footer: {
      source: 'Dados: Frankfurter · Banco Central Europeu',
      disclaimer: 'Cotações de referência, atualizadas em dias úteis.',
      builtWith: 'Construído com React, Vite e SVG puro.',
    },
    common: {
      clearSearch: 'Limpar busca',
      retry: 'Tentar novamente',
      range: '{start} — {end}',
      close: 'Fechar aviso',
      skipToContent: 'Pular para o conteúdo',
    },
  },

  en: {
    app: { name: 'HERMES', kicker: 'Exchange' },
    language: { label: 'Language' },
    page: {
      eyebrow: 'Reference rates · ECB',
      title: 'Exchange rates, clearly',
      description:
        'Convert, follow and export European Central Bank reference rates. Official data, no noise and no hidden fees.',
    },
    converter: {
      title: 'Currency converter',
      subtitle: 'Last working day’s reference rate',
      from: 'From',
      to: 'To',
      swap: 'Swap source and target currencies',
      amountLabel: 'Amount in {currency}',
      outputLabel: 'Converted amount in {currency}',
      amountErrors: {
        required: 'Enter an amount to convert.',
        invalid: 'Use a number greater than zero, such as 1,000.00.',
        tooLarge: 'The maximum amount is 1,000,000,000.',
      },
      rateLine: '1 {from} = {rate} {to}',
      quoteDate: 'Quoted on {date}',
      updating: 'Updating rate…',
      swapShort: 'Swap',
      hint: 'ECB reference rates, without commercial spread.',
    },
    chart: {
      title: 'Historical chart',
      subtitle: '{from} to {to}',
      periodsLabel: 'Chart period',
      periodLabel: 'Last {period}',
      periodNames: {
        '7D': '7 days',
        '15D': '15 days',
        '30D': '30 days',
        '3M': '3 months',
        '6M': '6 months',
        '1A': '1 year',
        '5A': '5 years',
        '10A': '10 years',
      },
      stats: {
        current: 'Current rate',
        min: 'Lowest',
        max: 'Highest',
        variation: 'Change',
        average: 'Average',
      },
      loading: 'Loading historical series…',
      emptyTitle: 'No data for this period',
      empty: 'Frankfurter published no rates for the selected days. Try a longer period.',
      chartLabel:
        'Line chart of the {from} to {to} rate between {start} and {end}. Lowest {min}, highest {max}.',
      pointLabel: '{date}: {rate}',
      keyboardHint: 'Use the arrow keys to explore chart points.',
    },
    rates: {
      title: 'Rates table',
      subtitle: '1 {base} across all supported currencies',
      subtitleWithDate: '1 {base} across all supported currencies · {date}',
      searchLabel: 'Search currency by code or name',
      searchPlaceholder: 'Search by code or name…',
      count: '{count} currencies',
      countOne: '{count} currency',
      columns: {
        code: 'Currency',
        name: 'Name',
        rate: 'Rate',
        converted: 'Converted amount',
        action: 'Action',
      },
      use: 'Use',
      useLabel: 'Use {code} as target currency',
      emptyTitle: 'No currency found',
      empty: 'No results for “{query}”. Check the code or the name.',
      emptyNoData: 'The source returned no rates for the selected base currency.',
      footnote: 'Rates relative to 1 {base}, published on working days.',
      clearSearch: 'Clear search',
      sortLabel: 'Sort by {column}',
      sortAscending: 'ascending',
      sortDescending: 'descending',
      sortMobileLabel: 'Sort table',
      sortOptions: {
        codeAsc: 'Code (A–Z)',
        codeDesc: 'Code (Z–A)',
        nameAsc: 'Name (A–Z)',
        nameDesc: 'Name (Z–A)',
        rateDesc: 'Highest rate',
        rateAsc: 'Lowest rate',
      },
      selected: 'Selected',
    },
    csv: {
      export: 'Export CSV',
      exportSeries: 'Export series',
      success: 'CSV exported with {count} rows.',
      successOne: 'CSV exported with {count} row.',
      error: 'Could not generate the CSV file.',
      empty: 'There is no data to export.',
      headers: {
        date: 'Date',
        base: 'Base currency',
        target: 'Target currency',
        name: 'Name',
        rate: 'Rate',
        converted: 'Converted amount',
      },
    },
    errors: {
      title: 'Could not load',
      network: 'Check your connection and try again.',
      http: 'The exchange service responded with an error ({status}).',
      invalid: 'The service returned unexpected data. Please try again.',
      generic: 'Something went wrong while fetching rates.',
      currencies: 'Could not load the currency list.',
      rate: 'Could not load the rate for this pair.',
      retry: 'Try again',
      loading: 'Loading…',
    },
    footer: {
      source: 'Data: Frankfurter · European Central Bank',
      disclaimer: 'Reference rates, updated on working days.',
      builtWith: 'Built with React, Vite and plain SVG.',
    },
    common: {
      clearSearch: 'Clear search',
      retry: 'Try again',
      range: '{start} — {end}',
      close: 'Dismiss notice',
      skipToContent: 'Skip to content',
    },
  },

  es: {
    app: { name: 'HERMES', kicker: 'Cambio' },
    language: { label: 'Idioma' },
    page: {
      eyebrow: 'Cotizaciones de referencia · BCE',
      title: 'El cambio, con claridad',
      description:
        'Convierte, sigue y exporta cotizaciones del Banco Central Europeo. Datos oficiales, sin ruido y sin comisiones ocultas.',
    },
    converter: {
      title: 'Conversor de monedas',
      subtitle: 'Cotización de referencia del último día hábil',
      from: 'De',
      to: 'A',
      swap: 'Cambiar moneda de origen y destino',
      amountLabel: 'Importe en {currency}',
      outputLabel: 'Importe convertido en {currency}',
      amountErrors: {
        required: 'Introduce un importe para convertir.',
        invalid: 'Usa un número mayor que cero, como 1.000,00.',
        tooLarge: 'El importe máximo es 1.000.000.000.',
      },
      rateLine: '1 {from} = {rate} {to}',
      quoteDate: 'Cotización del {date}',
      updating: 'Actualizando cotización…',
      swapShort: 'Cambiar',
      hint: 'Cotizaciones de referencia del BCE, sin diferencial comercial.',
    },
    chart: {
      title: 'Gráfico histórico',
      subtitle: '{from} a {to}',
      periodsLabel: 'Período del gráfico',
      periodLabel: 'Últimos {period}',
      periodNames: {
        '7D': '7 días',
        '15D': '15 días',
        '30D': '30 días',
        '3M': '3 meses',
        '6M': '6 meses',
        '1A': '1 año',
        '5A': '5 años',
        '10A': '10 años',
      },
      stats: {
        current: 'Tasa actual',
        min: 'Mínima',
        max: 'Máxima',
        variation: 'Variación',
        average: 'Media',
      },
      loading: 'Cargando serie histórica…',
      emptyTitle: 'Sin datos para este período',
      empty: 'Frankfurter no publicó cotizaciones en los días seleccionados. Prueba un período mayor.',
      chartLabel:
        'Gráfico de línea de la tasa de {from} a {to} entre {start} y {end}. Mínima {min}, máxima {max}.',
      pointLabel: '{date}: {rate}',
      keyboardHint: 'Usa las flechas para explorar los puntos del gráfico.',
    },
    rates: {
      title: 'Tabla de cotizaciones',
      subtitle: '1 {base} en todas las monedas disponibles',
      subtitleWithDate: '1 {base} en todas las monedas disponibles · {date}',
      searchLabel: 'Buscar moneda por código o nombre',
      searchPlaceholder: 'Buscar por código o nombre…',
      count: '{count} monedas',
      countOne: '{count} moneda',
      columns: {
        code: 'Moneda',
        name: 'Nombre',
        rate: 'Tasa',
        converted: 'Importe convertido',
        action: 'Acción',
      },
      use: 'Usar',
      useLabel: 'Usar {code} como moneda de destino',
      emptyTitle: 'No se encontró ninguna moneda',
      empty: 'No hay resultados para “{query}”. Revisa el código o el nombre.',
      emptyNoData: 'La fuente no devolvió cotizaciones para la moneda base elegida.',
      footnote: 'Cotizaciones relativas a 1 {base}, publicadas en días hábiles.',
      clearSearch: 'Limpiar búsqueda',
      sortLabel: 'Ordenar por {column}',
      sortAscending: 'ascendente',
      sortDescending: 'descendente',
      sortMobileLabel: 'Ordenar tabla',
      sortOptions: {
        codeAsc: 'Código (A–Z)',
        codeDesc: 'Código (Z–A)',
        nameAsc: 'Nombre (A–Z)',
        nameDesc: 'Nombre (Z–A)',
        rateDesc: 'Mayor tasa',
        rateAsc: 'Menor tasa',
      },
      selected: 'Seleccionada',
    },
    csv: {
      export: 'Exportar CSV',
      exportSeries: 'Exportar serie',
      success: 'CSV exportado con {count} filas.',
      successOne: 'CSV exportado con {count} fila.',
      error: 'No fue posible generar el archivo CSV.',
      empty: 'No hay datos para exportar.',
      headers: {
        date: 'Fecha',
        base: 'Moneda base',
        target: 'Moneda de destino',
        name: 'Nombre',
        rate: 'Tasa',
        converted: 'Importe convertido',
      },
    },
    errors: {
      title: 'No fue posible cargar',
      network: 'Revisa tu conexión e inténtalo de nuevo.',
      http: 'El servicio de cambio respondió con un error ({status}).',
      invalid: 'El servicio devolvió datos inesperados. Inténtalo de nuevo.',
      generic: 'Algo salió mal al consultar las cotizaciones.',
      currencies: 'No fue posible cargar la lista de monedas.',
      rate: 'No fue posible cargar la cotización de este par.',
      retry: 'Intentar de nuevo',
      loading: 'Cargando…',
    },
    footer: {
      source: 'Datos: Frankfurter · Banco Central Europeo',
      disclaimer: 'Cotizaciones de referencia, actualizadas en días hábiles.',
      builtWith: 'Creado con React, Vite y SVG puro.',
    },
    common: {
      clearSearch: 'Limpiar búsqueda',
      retry: 'Intentar de nuevo',
      range: '{start} — {end}',
      close: 'Cerrar aviso',
      skipToContent: 'Saltar al contenido',
    },
  },
};

export function getPeriodNameKey(periodId) {
  return PERIOD_KEYS[periodId] ?? '30d';
}

/** Merge profundo: acrescenta os textos da RIA sem tocar nos existentes. */
function mergeMessages(base, extra) {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return base;
  const output = { ...base };
  Object.entries(extra).forEach(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      base?.[key] &&
      typeof base[key] === 'object'
    ) {
      output[key] = mergeMessages(base[key], value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

Object.keys(translations).forEach((locale) => {
  translations[locale] = mergeMessages(translations[locale], riaTranslations[locale]);
});
