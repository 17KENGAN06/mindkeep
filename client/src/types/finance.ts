export type FinanceCurrency = 'EUR';
export type FinanceOperationType = 'INCOME' | 'EXPENSE';
export type FinanceMoneyKind = 'CASH' | 'ELECTRONIC';
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

export type FinanceKindTotals = {
  income: number;
  expense: number;
  balance: number;
};

export type FinanceOperation = {
  id: string;
  date: string;
  amount: number;
  currency: FinanceCurrency | string;
  type: FinanceOperationType;
  moneyKind: FinanceMoneyKind;
  comment: string;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
};

export type FinanceSummary = {
  settings: FinanceSettings;
  currency: FinanceCurrency;
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
  totalsByKind: {
    CASH: FinanceKindTotals;
    ELECTRONIC: FinanceKindTotals;
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
