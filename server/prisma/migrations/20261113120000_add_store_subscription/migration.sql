-- CreateEnum
CREATE TYPE "StoreKind" AS ENUM ('APP_STORE', 'PLAY_STORE');

-- CreateTable
CREATE TABLE "StoreSubscription" (
    "userId" TEXT NOT NULL,
    "store" "StoreKind" NOT NULL,
    "productId" TEXT NOT NULL,
    "plan" "UserPlan" NOT NULL,
    "interval" "PlanInterval",
    "expiresAt" TIMESTAMP(3),
    "willRenew" BOOLEAN NOT NULL DEFAULT true,
    "sandbox" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSubscription_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "StoreSubscription" ADD CONSTRAINT "StoreSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

