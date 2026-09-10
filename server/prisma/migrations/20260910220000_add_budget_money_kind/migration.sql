-- AlterEnum
CREATE TYPE "BudgetMoneyKind" AS ENUM ('CASH', 'ELECTRONIC');

-- AlterTable
ALTER TABLE "BudgetOperation" ADD COLUMN "moneyKind" "BudgetMoneyKind" NOT NULL DEFAULT 'ELECTRONIC';

-- CreateIndex
CREATE INDEX "BudgetOperation_userId_moneyKind_idx" ON "BudgetOperation"("userId", "moneyKind");
