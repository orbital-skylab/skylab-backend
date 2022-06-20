-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_deadlineId_fkey";

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
