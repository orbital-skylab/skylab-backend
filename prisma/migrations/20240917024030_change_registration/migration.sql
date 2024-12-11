/*
  Warnings:

  - You are about to drop the column `isRegistrationOpen` on the `VoterManagement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VoterManagement" DROP COLUMN "isRegistrationOpen",
ADD COLUMN     "registrationEndTime" TIMESTAMP(3),
ADD COLUMN     "registrationStartTime" TIMESTAMP(3);
