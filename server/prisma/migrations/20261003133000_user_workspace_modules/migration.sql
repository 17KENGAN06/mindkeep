ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "enabledModules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "User"
SET
  "onboardingCompletedAt" = COALESCE("createdAt", NOW()),
  "enabledModules" = ARRAY['tasks', 'review', 'notes', 'habits', 'finance', 'nutrition']::TEXT[];
