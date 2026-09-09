-- Finance / budget tables (idempotent for environments where tables already exist)

DO $$ BEGIN
  CREATE TYPE "BudgetCurrency" AS ENUM ('RUB', 'USD', 'EUR', 'UAH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "BudgetOperationType" AS ENUM ('INCOME', 'EXPENSE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "BudgetSettings" (
  "id" TEXT NOT NULL,
  "displayCurrency" "BudgetCurrency" NOT NULL DEFAULT 'EUR',
  "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "openingCurrency" "BudgetCurrency" NOT NULL DEFAULT 'EUR',
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BudgetCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BudgetOperation" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" "BudgetCurrency" NOT NULL DEFAULT 'EUR',
  "type" "BudgetOperationType" NOT NULL,
  "comment" TEXT NOT NULL DEFAULT '',
  "categoryId" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetOperation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExchangeRate" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "currency" "BudgetCurrency" NOT NULL,
  "rateToRub" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BudgetSettings_userId_key" ON "BudgetSettings"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "BudgetCategory_userId_name_key" ON "BudgetCategory"("userId", "name");
CREATE INDEX IF NOT EXISTS "BudgetCategory_userId_idx" ON "BudgetCategory"("userId");
CREATE INDEX IF NOT EXISTS "BudgetOperation_categoryId_idx" ON "BudgetOperation"("categoryId");
CREATE INDEX IF NOT EXISTS "BudgetOperation_userId_date_idx" ON "BudgetOperation"("userId", "date");
CREATE INDEX IF NOT EXISTS "BudgetOperation_userId_idx" ON "BudgetOperation"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExchangeRate_date_currency_key" ON "ExchangeRate"("date", "currency");
CREATE INDEX IF NOT EXISTS "ExchangeRate_date_idx" ON "ExchangeRate"("date");

DO $$ BEGIN
  ALTER TABLE "BudgetSettings" ADD CONSTRAINT "BudgetSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BudgetOperation" ADD CONSTRAINT "BudgetOperation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BudgetOperation" ADD CONSTRAINT "BudgetOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
