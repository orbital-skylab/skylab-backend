/*
  Warnings:

  - Added the required column `achievement` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamName` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "achievement" "AchievementLevel" NOT NULL,
ADD COLUMN     "teamName" TEXT NOT NULL;
