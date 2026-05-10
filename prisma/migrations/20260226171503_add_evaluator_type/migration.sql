-- CreateEnum
CREATE TYPE "EvaluatorType" AS ENUM ('Adviser', 'Team', 'Both');

-- AlterTable
ALTER TABLE "Deadline" ADD COLUMN     "evaluatorType" "EvaluatorType";
