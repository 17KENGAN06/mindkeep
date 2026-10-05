-- Per-currency monthly spending envelopes (no FX conversion)
ALTER TABLE "BudgetSettings" ADD COLUMN IF NOT EXISTS "monthlyLimits" JSONB NOT NULL DEFAULT '{}';
