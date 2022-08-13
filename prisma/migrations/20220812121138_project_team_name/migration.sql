/*
  Warnings:

  - A unique constraint covering the columns `[teamName,cohortYear]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Made the column `teamName` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Project_name_cohortYear_key";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "teamName" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_teamName_cohortYear_key" ON "Project"("teamName", "cohortYear");
