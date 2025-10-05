/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."User_role_idx";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "role",
ADD COLUMN     "userRole" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "User_userRole_idx" ON "public"."User"("userRole");
