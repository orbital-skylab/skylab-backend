/*
  Warnings:

  - A unique constraint covering the columns `[userId,cohortYear]` on the table `Adviser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,cohortYear]` on the table `Facilitator` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,cohortYear]` on the table `Mentor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,cohortYear]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,cohortYear]` on the table `Tutor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Cohort" ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Adviser_userId_cohortYear_key" ON "Adviser"("userId", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Facilitator_userId_cohortYear_key" ON "Facilitator"("userId", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_userId_cohortYear_key" ON "Mentor"("userId", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_cohortYear_key" ON "Student"("userId", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_userId_cohortYear_key" ON "Tutor"("userId", "cohortYear");
