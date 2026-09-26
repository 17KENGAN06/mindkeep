-- Split a daily task into equal parts (1/3, 2/3, ...)

ALTER TABLE "DailyTask" ADD COLUMN IF NOT EXISTS "splitCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "DailyTask" ADD COLUMN IF NOT EXISTS "splitDone" INTEGER NOT NULL DEFAULT 0;
