/*
  Warnings:

  - You are about to drop the column `advisorWeight` on the `ResultsFilter` table. All the data in the column will be lost.
  - You are about to alter the column `studentWeight` on the `ResultsFilter` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `mentorWeight` on the `ResultsFilter` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `administratorWeight` on the `ResultsFilter` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `publicWeight` on the `ResultsFilter` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `adviserWeight` to the `ResultsFilter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `showVotes` to the `ResultsFilter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResultsFilter" DROP COLUMN "advisorWeight",
ADD COLUMN     "adviserWeight" INTEGER NOT NULL,
ADD COLUMN     "showVotes" BOOLEAN NOT NULL,
ALTER COLUMN "studentWeight" SET DATA TYPE INTEGER,
ALTER COLUMN "mentorWeight" SET DATA TYPE INTEGER,
ALTER COLUMN "administratorWeight" SET DATA TYPE INTEGER,
ALTER COLUMN "publicWeight" SET DATA TYPE INTEGER;
