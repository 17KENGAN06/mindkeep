-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeScheduleId" TEXT,
ADD COLUMN "pendingPlan" "UserPlan",
ADD COLUMN "pendingInterval" "PlanInterval",
ADD COLUMN "pendingChangeAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeScheduleId_key" ON "User"("stripeScheduleId");
