-- AlterTable
ALTER TABLE "AuthSession" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'browser';
ALTER TABLE "AuthSession" ADD COLUMN "refreshTokenHash" TEXT;
ALTER TABLE "AuthSession" ADD COLUMN "refreshExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AuthSession_refreshTokenHash_idx" ON "AuthSession"("refreshTokenHash");
