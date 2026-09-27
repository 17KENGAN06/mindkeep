export const FINANCE_CURRENCIES = [
  'UAH',
  'EUR',
  'USD',
  'PLN',
  'GBP',
  'CHF',
  'CZK',
  'RON',
  'TRY',
  'GEL',
  'KZT',
  'RUB',
] as const;

export type FinanceCurrency = (typeof FINANCE_CURRENCIES)[number];

export function isFinanceCurrency(value: string): value is FinanceCurrency {
  return (FINANCE_CURRENCIES as readonly string[]).includes(value);
}

export function currencyLabel(code: string, locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'currency' }).of(code);
    return name ? `${code} · ${name}` : code;
  } catch {
    return code;
  }
}

export function currencyOptions(locale: string): Array<{ value: FinanceCurrency; label: string }> {
  return FINANCE_CURRENCIES.map((code) => ({
    value: code,
    label: currencyLabel(code, locale),
  }));
}
