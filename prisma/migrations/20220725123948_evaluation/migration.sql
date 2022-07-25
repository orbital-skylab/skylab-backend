/*
  Warnings:

  - You are about to drop the `Evaluation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[evaluatingMilestoneId]` on the table `Deadline` will be added. If there are existing duplicate values, this will fail.
  - Made the column `startDate` on table `Cohort` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `Cohort` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `evaluatingMilestoneId` to the `Deadline` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_deadlineId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_milestoneId_fkey";

-- AlterTable
ALTER TABLE "Cohort" ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "Deadline" ADD COLUMN     "evaluatingMilestoneId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Evaluation";

-- CreateIndex
CREATE UNIQUE INDEX "Deadline_evaluatingMilestoneId_key" ON "Deadline"("evaluatingMilestoneId");

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_evaluatingMilestoneId_fkey" FOREIGN KEY ("evaluatingMilestoneId") REFERENCES "Deadline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
