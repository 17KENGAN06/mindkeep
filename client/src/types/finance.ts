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
  amountInDisplay: number;
  category?: { id: string; name: string } | null;
};

export type FinanceRates = Record<FinanceCurrency, number>;

export type FinanceSummary = {
  settings: FinanceSettings;
  rates: FinanceRates;
  ratesAsOf: string;
  ratesSource: string;
  period: {
    view: FinanceView;
    year: number;
    month: number | null;
    from: string;
    to: string;
  };
  totals: {
    income: number;
    expense: number;
    balance: number;
    openingBalance: number;
    netWithOpening: number;
  };
  byCategory: Array<{ id: string | null; name: string; expense: number }>;
  byMonth: Array<{ month: number; income: number; expense: number; balance: number }>;
  operations: FinanceOperation[];
};

export type FinancePeriodParams = {
  view: FinanceView;
  year: number;
  month?: number;
};
