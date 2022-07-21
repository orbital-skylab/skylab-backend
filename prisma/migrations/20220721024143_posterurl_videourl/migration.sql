/*
  Warnings:

  - You are about to drop the column `mentorUserId` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_mentorUserId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "mentorUserId",
ADD COLUMN     "mentorId" INTEGER,
ADD COLUMN     "posterUrl" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
