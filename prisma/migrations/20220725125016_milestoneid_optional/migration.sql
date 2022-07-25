-- DropForeignKey
ALTER TABLE "Deadline" DROP CONSTRAINT "Deadline_evaluatingMilestoneId_fkey";

-- AlterTable
ALTER TABLE "Deadline" ALTER COLUMN "evaluatingMilestoneId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_evaluatingMilestoneId_fkey" FOREIGN KEY ("evaluatingMilestoneId") REFERENCES "Deadline"("id") ON DELETE SET NULL ON UPDATE CASCADE;
