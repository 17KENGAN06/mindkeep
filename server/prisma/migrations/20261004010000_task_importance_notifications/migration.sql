ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TASK_IMPORTANT';

ALTER TABLE "DailyTask" ADD COLUMN IF NOT EXISTS "important" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "dailyTaskId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Notification_dailyTaskId_key" ON "Notification"("dailyTaskId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_dailyTaskId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_dailyTaskId_fkey"
      FOREIGN KEY ("dailyTaskId") REFERENCES "DailyTask"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "DailyTask_userId_important_idx" ON "DailyTask"("userId", "important");
