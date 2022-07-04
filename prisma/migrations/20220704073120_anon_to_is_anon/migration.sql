/*
  Warnings:

  - You are about to drop the column `anonymous` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "anonymous",
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
