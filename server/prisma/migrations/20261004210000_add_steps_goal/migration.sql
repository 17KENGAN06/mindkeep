-- AlterTable
ALTER TABLE "NutritionSettings" ADD COLUMN "stepsGoal" INTEGER NOT NULL DEFAULT 10000;

-- CreateTable
CREATE TABLE "StepsDay" (
    "id" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepsDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StepsDay_userId_date_key" ON "StepsDay"("userId", "date");

-- CreateIndex
CREATE INDEX "StepsDay_userId_date_idx" ON "StepsDay"("userId", "date");

-- AddForeignKey
ALTER TABLE "StepsDay" ADD CONSTRAINT "StepsDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
