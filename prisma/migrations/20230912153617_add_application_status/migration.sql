/*
  Warnings:

  - Added the required column `status` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('Unprocessed', 'Approved', 'Rejected');

-- DropForeignKey
ALTER TABLE "AnonymousApplicant" DROP CONSTRAINT "AnonymousApplicant_applicationSubmissionId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_submissionId_fkey";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "status" "ApplicationStatus" NOT NULL;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousApplicant" ADD CONSTRAINT "AnonymousApplicant_applicationSubmissionId_fkey" FOREIGN KEY ("applicationSubmissionId") REFERENCES "Application"("submissionId") ON DELETE CASCADE ON UPDATE CASCADE;
