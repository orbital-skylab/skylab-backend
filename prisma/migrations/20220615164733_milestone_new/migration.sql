/*
  Warnings:

  - You are about to drop the `Milestone` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DeadlineType" AS ENUM ('Liftoff', 'Splashdown', 'MilestoneOne', 'MilestoneTwo', 'MilestoneThree', 'Evaluation', 'Feedback', 'Survey', 'Other');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('ShortAnswer', 'LongAnswer', 'MultiSelect', 'Url', 'MultipleChoice');

-- DropForeignKey
ALTER TABLE "Milestone" DROP CONSTRAINT "Milestone_projectId_fkey";

-- DropTable
DROP TABLE "Milestone";

-- CreateTable
CREATE TABLE "Deadline" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cohortYear" INTEGER NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "dueBy" TIMESTAMP(3) NOT NULL,
    "type" "DeadlineType" NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "deadlineId" INTEGER NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "questionId" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("questionId","answer")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deadline_name_cohortYear_key" ON "Deadline"("name", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Question_deadlineId_questionNumber_key" ON "Question"("deadlineId", "questionNumber");

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_cohortYear_fkey" FOREIGN KEY ("cohortYear") REFERENCES "Cohort"("academicYear") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
