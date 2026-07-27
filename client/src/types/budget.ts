export type BudgetCurrency = 'RUB' | 'USD' | 'EUR' | 'UAH';
export type BudgetOperationType = 'INCOME' | 'EXPENSE';

export type BudgetSettings = {
  id: string;
  displayCurrency: BudgetCurrency;
  openingBalance: number;
  openingCurrency: BudgetCurrency;
};

export type BudgetCategory = {
  id: string;
  name: string;
};

export type BudgetOperation = {
  id: string;
  date: string;
  dateKey: string;
  amount: number;
  amountDisplay: number;
  currency: BudgetCurrency;
  type: BudgetOperationType;
  comment: string;
  category: { id: string; name: string } | null;
};

export type MandatoryPaymentRow = {
  id: string;
  index: number;
  name: string;
  dayOfMonth: number;
  amount: number;
  amountDisplay: number;
  currency: BudgetCurrency;
  paid: boolean;
};

export type MonthOverview = {
  openingBalance: number;
  closingBalance: number;
  currentBalance: number;
  income: number;
  expenses: number;
  mandatoryPayments: number;
  difference: number;
};

export type YearMonthRow = {
  month: number;
  openingBalance: number;
  income: number;
  expenses: number;
  mandatoryPayments: number;
  difference: number;
  closingBalance: number;
};
