-- Allow accounts created by an external identity provider to omit a password.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Google subject ("sub") is stable and unique for a Google account.
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
