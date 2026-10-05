import { FINANCE_CURRENCIES, type FinanceCurrency } from '@/features/finance/currencies';
import type { FinanceMoneyKind, FinanceOperationType } from '@/types/finance';

export type FinanceDraftOperation = {
  date: string;
  amount: number;
  currency: FinanceCurrency;
  type: FinanceOperationType;
  moneyKind: FinanceMoneyKind;
  comment: string;
  categoryName?: string;
  categoryId?: string | null;
};

export type ParseFinanceImportResult = {
  rows: FinanceDraftOperation[];
  skipped: number;
};

const MAX_ROWS = 40;
const INCOME_WORDS = /\b(income|inflow|credit|salary|зарплат|доход|приход|wpływ|przychód|einnahme|entrata|ingreso|tulo)\b/i;
const EXPENSE_WORDS = /\b(expense|outflow|debit|расход|списан|wydat|wydatek|ausgabe|uscita|gasto|meno)\b/i;
const CASH_WORDS = /\b(cash|налич|gotówk|bar|espèces|contant|käteis)\b/i;
const HEADER_DATE = /^(date|дата|data|datum)$/i;
const HEADER_AMOUNT = /^(amount|sum|suma|сумма|kwota|betrag|importo|importe|summa)$/i;
const HEADER_TYPE = /^(type|тип|rodzaj|art|tipo|tyyppi)$/i;
const HEADER_CURRENCY = /^(currency|валюта|waluta|währung|valuta|moneda|valuutta)$/i;
const HEADER_COMMENT = /^(comment|description|details|описание|коммент|opis|beschreibung|descrizione|descripción|kuvaus)$/i;
const HEADER_CATEGORY = /^(category|категор|kategoria|kategorie|categoria|categoría)$/i;
const HEADER_KIND = /^(kind|form|formа|вид|gotówka|cash|money)$/i;

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(sample: string): ',' | ';' | '\t' {
  const first = sample.split(/\r?\n/).find((line) => line.trim()) ?? '';
  const counts = {
    '\t': (first.match(/\t/g) ?? []).length,
    ';': (first.match(/;/g) ?? []).length,
    ',': (first.match(/,/g) ?? []).length,
  };
  if (counts['\t'] >= counts[';'] && counts['\t'] >= counts[',']) return '\t';
  if (counts[';'] > counts[',']) return ';';
  return ',';
}

function parseDateToken(raw: string): string | null {
  const value = raw.trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dotted = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!dotted) return null;
  const day = dotted[1]!.padStart(2, '0');
  const month = dotted[2]!.padStart(2, '0');
  let year = dotted[3]!;
  if (year.length === 2) year = Number(year) > 70 ? `19${year}` : `20${year}`;
  if (Number(month) < 1 || Number(month) > 12) return null;
  if (Number(day) < 1 || Number(day) > 31) return null;
  return `${year}-${month}-${day}`;
}

function parseAmountToken(raw: string): { amount: number; negative: boolean; plus: boolean } | null {
  let text = raw.trim().replace(/[\s\u00a0']/g, '');
  if (!text) return null;
  const plus = /^\+/.test(text);
  const negative = /^-/.test(text) || /−/.test(text) || /^\(.*\)$/.test(text);
  text = text.replace(/[()−+-]/g, '');
  text = text.replace(/[€$£₴zł]/gi, '');
  for (const code of FINANCE_CURRENCIES) {
    text = text.replace(new RegExp(code, 'ig'), '');
  }
  text = text.replace(/грн\.?|uah|руб\.?/gi, '');
  if (!text) return null;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    text = lastComma > lastDot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (lastComma > -1) {
    const fraction = text.slice(lastComma + 1);
    text = fraction.length <= 2 ? text.replace(',', '.') : text.replace(/,/g, '');
  }

  const amount = Number(text);
  if (!Number.isFinite(amount) || amount === 0) return null;
  return { amount: Math.round(Math.abs(amount) * 100) / 100, negative, plus };
}

function parseCurrencyToken(raw: string, fallback: FinanceCurrency): FinanceCurrency {
  const upper = raw.toUpperCase();
  for (const code of FINANCE_CURRENCIES) {
    if (upper.includes(code)) return code;
  }
  if (/грн|₴/.test(raw)) return 'UAH';
  if (/€|евро|euro/i.test(raw)) return 'EUR';
  if (/\$|доллар|usd/i.test(raw)) return 'USD';
  if (/zł|злот/i.test(raw)) return 'PLN';
  if (/£|gbp|фунт/i.test(raw)) return 'GBP';
  return fallback;
}

function parseTypeToken(raw: string, amountNegative: boolean, plusIncome = false): FinanceOperationType {
  if (INCOME_WORDS.test(raw) || plusIncome) return 'INCOME';
  if (EXPENSE_WORDS.test(raw) || amountNegative) return 'EXPENSE';
  return 'EXPENSE';
}

function parseKindToken(raw: string): FinanceMoneyKind {
  return CASH_WORDS.test(raw) ? 'CASH' : 'ELECTRONIC';
}

function headerIndex(headers: string[], test: RegExp): number {
  return headers.findIndex((header) => test.test(header.trim()));
}

function fromCells(
  cells: string[],
  map: {
    date: number;
    amount: number;
    type: number;
    currency: number;
    comment: number;
    category: number;
    kind: number;
  },
  fallbackCurrency: FinanceCurrency,
): FinanceDraftOperation | null {
  const date = parseDateToken(cells[map.date] ?? '');
  const parsedAmount = parseAmountToken(cells[map.amount] ?? '');
  if (!date || !parsedAmount) return null;
  const typeCell = map.type >= 0 ? (cells[map.type] ?? '') : '';
  const currencyCell = map.currency >= 0 ? (cells[map.currency] ?? '') : cells.join(' ');
  const comment = (map.comment >= 0 ? (cells[map.comment] ?? '') : cells.filter((_, i) => i !== map.date && i !== map.amount).join(' '))
    .trim()
    .slice(0, 500);
  const categoryName = map.category >= 0 ? (cells[map.category] ?? '').trim().slice(0, 80) : '';
  const kindCell = map.kind >= 0 ? (cells[map.kind] ?? '') : comment;
  return {
    date,
    amount: parsedAmount.amount,
    currency: parseCurrencyToken(currencyCell, fallbackCurrency),
    type: parseTypeToken(typeCell || comment, parsedAmount.negative, parsedAmount.plus),
    moneyKind: parseKindToken(kindCell),
    comment,
    ...(categoryName ? { categoryName } : {}),
  };
}

function parseLooseLine(line: string, fallbackCurrency: FinanceCurrency): FinanceDraftOperation | null {
  const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/);
  if (!dateMatch) return null;
  const date = parseDateToken(dateMatch[1] ?? '');
  if (!date) return null;
  const withoutDate = line.replace(dateMatch[0], ' ');
  const amountMatch = withoutDate.match(/-?\(?\d[\d\s.,']*\)?/);
  if (!amountMatch) return null;
  const parsedAmount = parseAmountToken(amountMatch[0]);
  if (!parsedAmount) return null;
  const comment = withoutDate.replace(amountMatch[0], ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  return {
    date,
    amount: parsedAmount.amount,
    currency: parseCurrencyToken(line, fallbackCurrency),
    type: parseTypeToken(line, parsedAmount.negative, parsedAmount.plus),
    moneyKind: parseKindToken(line),
    comment,
  };
}

export function parseFinanceImport(text: string, fallbackCurrency: FinanceCurrency = 'EUR'): ParseFinanceImportResult {
  const source = text.replace(/^\uFEFF/, '').trim();
  if (!source) return { rows: [], skipped: 0 };

  const delimiter = detectDelimiter(source);
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows: FinanceDraftOperation[] = [];
  let skipped = 0;

  const firstCells = splitCsvLine(lines[0] ?? '', delimiter);
  const looksHeader =
    headerIndex(firstCells, HEADER_DATE) >= 0 && headerIndex(firstCells, HEADER_AMOUNT) >= 0;

  if (looksHeader) {
    const map = {
      date: headerIndex(firstCells, HEADER_DATE),
      amount: headerIndex(firstCells, HEADER_AMOUNT),
      type: headerIndex(firstCells, HEADER_TYPE),
      currency: headerIndex(firstCells, HEADER_CURRENCY),
      comment: headerIndex(firstCells, HEADER_COMMENT),
      category: headerIndex(firstCells, HEADER_CATEGORY),
      kind: headerIndex(firstCells, HEADER_KIND),
    };
    for (const line of lines.slice(1)) {
      const row = fromCells(splitCsvLine(line, delimiter), map, fallbackCurrency);
      if (!row) {
        skipped += 1;
        continue;
      }
      rows.push(row);
      if (rows.length >= MAX_ROWS) break;
    }
    return { rows, skipped };
  }

  for (const line of lines) {
    const cells = splitCsvLine(line, delimiter);
    const row =
      cells.length >= 2
        ? fromCells(
            cells,
            {
              date: 0,
              amount: 1,
              type: 2,
              currency: 3,
              comment: 4,
              category: 5,
              kind: 6,
            },
            fallbackCurrency,
          ) ?? parseLooseLine(line, fallbackCurrency)
        : parseLooseLine(line, fallbackCurrency);
    if (!row) {
      skipped += 1;
      continue;
    }
    rows.push(row);
    if (rows.length >= MAX_ROWS) break;
  }

  return { rows, skipped };
}
