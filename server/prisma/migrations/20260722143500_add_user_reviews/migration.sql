CREATE TYPE "UserReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "UserReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "location" TEXT,
    "status" "UserReviewStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserReview_userId_key" ON "UserReview"("userId");
CREATE INDEX "UserReview_status_createdAt_idx" ON "UserReview"("status", "createdAt");

ALTER TABLE "UserReview"
ADD CONSTRAINT "UserReview_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
