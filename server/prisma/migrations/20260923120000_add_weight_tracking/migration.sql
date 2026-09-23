-- AlterTable
ALTER TABLE "NutritionSettings" ADD COLUMN "weightGoal" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "WeightDay" (
    "id" TEXT NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeightDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeightDay_userId_date_key" ON "WeightDay"("userId", "date");

-- CreateIndex
CREATE INDEX "WeightDay_userId_date_idx" ON "WeightDay"("userId", "date");

-- AddForeignKey
ALTER TABLE "WeightDay" ADD CONSTRAINT "WeightDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
