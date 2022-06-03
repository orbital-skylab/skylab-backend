/*
  Warnings:

  - The primary key for the `Cohort` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Cohort` table. All the data in the column will be lost.
  - You are about to drop the column `cohortId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `cohortId` on the `User` table. All the data in the column will be lost.
  - Added the required column `cohortYear` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cohortYear` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_cohortId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_cohortId_fkey";

-- AlterTable
ALTER TABLE "Cohort" DROP CONSTRAINT "Cohort_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Cohort_pkey" PRIMARY KEY ("academicYear");

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "cohortId",
ADD COLUMN     "cohortYear" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "cohortId",
ADD COLUMN     "cohortYear" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cohortYear_fkey" FOREIGN KEY ("cohortYear") REFERENCES "Cohort"("academicYear") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_cohortYear_fkey" FOREIGN KEY ("cohortYear") REFERENCES "Cohort"("academicYear") ON DELETE RESTRICT ON UPDATE CASCADE;
