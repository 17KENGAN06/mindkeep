-- CreateTable
CREATE TABLE "GoogleSignInTicket" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "idToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleSignInTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleSignInTicket_codeHash_key" ON "GoogleSignInTicket"("codeHash");

-- CreateIndex
CREATE INDEX "GoogleSignInTicket_expiresAt_idx" ON "GoogleSignInTicket"("expiresAt");
