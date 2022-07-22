/*
  Warnings:

  - You are about to drop the column `evaluationGroupId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `EvaluationGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EvaluationGroup" DROP CONSTRAINT "EvaluationGroup_adviserId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_evaluationGroupId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "evaluationGroupId";

-- DropTable
DROP TABLE "EvaluationGroup";

-- CreateTable
CREATE TABLE "EvaluationRelation" (
    "id" SERIAL NOT NULL,
    "fromProjectId" INTEGER NOT NULL,
    "toProjectId" INTEGER NOT NULL,

    CONSTRAINT "EvaluationRelation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EvaluationRelation" ADD CONSTRAINT "EvaluationRelation_fromProjectId_fkey" FOREIGN KEY ("fromProjectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRelation" ADD CONSTRAINT "EvaluationRelation_toProjectId_fkey" FOREIGN KEY ("toProjectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
