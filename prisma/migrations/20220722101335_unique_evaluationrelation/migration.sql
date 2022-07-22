/*
  Warnings:

  - A unique constraint covering the columns `[fromProjectId,toProjectId]` on the table `EvaluationRelation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRelation_fromProjectId_toProjectId_key" ON "EvaluationRelation"("fromProjectId", "toProjectId");
