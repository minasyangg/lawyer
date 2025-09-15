/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[twoFactorSecret]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'EDITOR', 'USER');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."LoginAttemptResult" AS ENUM ('SUCCESS', 'FAILED', 'BLOCKED', 'TWO_FACTOR_REQUIRED', 'TWO_FACTOR_FAILED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "registrationNote" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "twoFactorBackupCodes" JSONB,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "public"."LoginLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "result" "public"."LoginAttemptResult" NOT NULL,
    "failureReason" TEXT,
    "twoFactorUsed" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginLog_userId_idx" ON "public"."LoginLog"("userId");

-- CreateIndex
CREATE INDEX "LoginLog_email_idx" ON "public"."LoginLog"("email");

-- CreateIndex
CREATE INDEX "LoginLog_ipAddress_idx" ON "public"."LoginLog"("ipAddress");

-- CreateIndex
CREATE INDEX "LoginLog_createdAt_idx" ON "public"."LoginLog"("createdAt");

-- CreateIndex
CREATE INDEX "LoginLog_result_idx" ON "public"."LoginLog"("result");

-- CreateIndex
CREATE UNIQUE INDEX "User_twoFactorSecret_key" ON "public"."User"("twoFactorSecret");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "public"."User"("passwordResetToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
