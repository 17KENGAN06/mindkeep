-- AlterEnum
ALTER TYPE "AdminAuditAction" ADD VALUE 'BETA_GRANTED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'BETA_REVOKED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "betaTester" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserReview" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- CreateIndex
CREATE INDEX "UserReview_status_locale_createdAt_idx" ON "UserReview"("status", "locale", "createdAt");
