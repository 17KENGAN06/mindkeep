export type FinanceCurrency = 'RUB' | 'USD' | 'EUR' | 'UAH';
export type FinanceOperationType = 'INCOME' | 'EXPENSE';
export type FinanceView = 'month' | 'year';

export type FinanceSettings = {
  id: string;
  displayCurrency: FinanceCurrency;
  openingBalance: number;
  openingCurrency: FinanceCurrency;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceCategory = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { operations: number };
};

export type FinanceOperation = {
  id: string;
  date: string;
  amount: number;
  currency: FinanceCurrency;
  type: FinanceOperationType;
  comment: string;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
};

export type FinanceCurrencyTotals = {
  currency: FinanceCurrency;
  income: number;
  expense: number;
  balance: number;
};

export type FinanceSummary = {
  settings: FinanceSettings;
  period: {
    view: FinanceView;
    year: number;
    month: number | null;
    from: string;
    to: string;
  };
  totalsByCurrency: FinanceCurrencyTotals[];
  opening: {
    amount: number;
    currency: FinanceCurrency;
  };
  byCategory: Array<{
    id: string | null;
    name: string;
    expenses: Array<{ currency: FinanceCurrency; expense: number }>;
  }>;
  byMonth: Array<{
    month: number;
    byCurrency: FinanceCurrencyTotals[];
  }>;
  operations: FinanceOperation[];
};

export type FinancePeriodParams = {
  view: FinanceView;
  year: number;
  month?: number;
};
