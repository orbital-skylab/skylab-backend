/*
  Warnings:

  - You are about to drop the column `matricNo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nusnetId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "matricNo" VARCHAR(40),
ADD COLUMN     "nusnetId" VARCHAR(40);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "matricNo",
DROP COLUMN "nusnetId";
