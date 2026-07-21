-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReminderIntervalType" AS ENUM ('THREE_DAYS', 'SEVEN_DAYS', 'THIRTY_DAYS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REVIEW_DUE', 'REVIEW_OVERDUE', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Helsinki',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMaterial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "question" TEXT,
    "answer" TEXT,
    "sourceUrl" TEXT,
    "learnedAt" TIMESTAMP(3) NOT NULL,
    "status" "MaterialStatus" NOT NULL DEFAULT 'ACTIVE',
    "categoryId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReminder" (
    "id" TEXT NOT NULL,
    "intervalType" "ReminderIntervalType" NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "notificationCreatedAt" TIMESTAMP(3),
    "materialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "materialId" TEXT,
    "reminderId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

-- CreateIndex
CREATE INDEX "LearningMaterial_userId_idx" ON "LearningMaterial"("userId");

-- CreateIndex
CREATE INDEX "LearningMaterial_userId_status_idx" ON "LearningMaterial"("userId", "status");

-- CreateIndex
CREATE INDEX "LearningMaterial_categoryId_idx" ON "LearningMaterial"("categoryId");

-- CreateIndex
CREATE INDEX "LearningMaterial_learnedAt_idx" ON "LearningMaterial"("learnedAt");

-- CreateIndex
CREATE INDEX "ReviewReminder_userId_idx" ON "ReviewReminder"("userId");

-- CreateIndex
CREATE INDEX "ReviewReminder_scheduledAt_idx" ON "ReviewReminder"("scheduledAt");

-- CreateIndex
CREATE INDEX "ReviewReminder_userId_scheduledAt_status_idx" ON "ReviewReminder"("userId", "scheduledAt", "status");

-- CreateIndex
CREATE INDEX "ReviewReminder_status_scheduledAt_idx" ON "ReviewReminder"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewReminder_materialId_intervalType_key" ON "ReviewReminder"("materialId", "intervalType");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_reminderId_key" ON "Notification"("reminderId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReminder" ADD CONSTRAINT "ReviewReminder_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReminder" ADD CONSTRAINT "ReviewReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "ReviewReminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
