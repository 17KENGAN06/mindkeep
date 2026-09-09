-- Daily planning tasks

CREATE TABLE IF NOT EXISTS "DailyTask" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "minutes" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "note" TEXT NOT NULL DEFAULT '',
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DailyTask_userId_idx" ON "DailyTask"("userId");
CREATE INDEX IF NOT EXISTS "DailyTask_userId_date_idx" ON "DailyTask"("userId", "date");
CREATE INDEX IF NOT EXISTS "DailyTask_userId_completed_date_idx" ON "DailyTask"("userId", "completed", "date");

DO $$ BEGIN
  ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
