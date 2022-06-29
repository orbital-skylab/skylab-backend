/*
  Warnings:

  - Added the required column `anonymous` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "anonymous" BOOLEAN NOT NULL;
