/*
  Warnings:

  - The values [Liftoff,Splashdown,MilestoneOne,MilestoneTwo,MilestoneThree,Feedback] on the enum `DeadlineType` will be removed. If these variants are still used in the database, this will fail.
  - The values [LongAnswer,MultiSelect] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Administrator` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Answer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `teamId` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[questionId,order]` on the table `Option` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `submissionId` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Option` table without a default value. This is not possible if the table is not empty.
  - Added the required column `desc` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeadlineType_new" AS ENUM ('Milestone', 'Evaluation', 'Survey', 'Other');
ALTER TABLE "Deadline" ALTER COLUMN "type" TYPE "DeadlineType_new" USING ("type"::text::"DeadlineType_new");
ALTER TYPE "DeadlineType" RENAME TO "DeadlineType_old";
ALTER TYPE "DeadlineType_new" RENAME TO "DeadlineType";
DROP TYPE "DeadlineType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('ShortAnswer', 'Paragraph', 'MultipleChoice', 'Checkboxes', 'Dropdown', 'Url', 'Date', 'Time');
ALTER TABLE "Question" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "QuestionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_teamId_fkey";

-- DropIndex
DROP INDEX "Option_questionId_option_key";

-- DropIndex
DROP INDEX "User_password_key";

-- AlterTable
ALTER TABLE "Administrator" DROP CONSTRAINT "Administrator_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Administrator_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Adviser" ADD COLUMN     "matricNo" TEXT,
ADD COLUMN     "nusnetId" TEXT;

-- AlterTable
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_pkey",
ADD COLUMN     "submissionId" INTEGER NOT NULL,
ADD CONSTRAINT "Answer_pkey" PRIMARY KEY ("submissionId", "questionId", "answer");

-- AlterTable
ALTER TABLE "Deadline" ALTER COLUMN "createdOn" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "submitterId" INTEGER;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "desc" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "teamId",
ADD COLUMN     "projectId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "submitterId" INTEGER;

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "evaluateeId" INTEGER,
    "submitterId" INTEGER,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submitter" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Submitter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Option_questionId_order_key" ON "Option"("questionId", "order");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_evaluateeId_fkey" FOREIGN KEY ("evaluateeId") REFERENCES "Submitter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
