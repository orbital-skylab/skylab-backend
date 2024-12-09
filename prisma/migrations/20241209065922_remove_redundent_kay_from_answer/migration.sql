/*
  Warnings:

  - The primary key for the `Answer` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_pkey",
ADD CONSTRAINT "Answer_pkey" PRIMARY KEY ("submissionId", "questionId");
