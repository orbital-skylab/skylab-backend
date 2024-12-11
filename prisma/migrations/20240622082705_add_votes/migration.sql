/*
  Warnings:

  - You are about to drop the column `rank` on the `Vote` table. All the data in the column will be lost.
  - You are about to drop the column `hasRankChoices` on the `VoteConfig` table. All the data in the column will be lost.
  - You are about to drop the column `isCumulative` on the `VoteConfig` table. All the data in the column will be lost.
  - You are about to drop the column `hasExternalCsvImport` on the `VoterManagement` table. All the data in the column will be lost.
  - You are about to drop the column `hasGeneration` on the `VoterManagement` table. All the data in the column will be lost.
  - You are about to drop the column `hasInternalCsvImport` on the `VoterManagement` table. All the data in the column will be lost.
  - You are about to drop the column `hasRegistration` on the `VoterManagement` table. All the data in the column will be lost.
  - You are about to drop the `RankWeight` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `instructions` to the `VoteConfig` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RankWeight" DROP CONSTRAINT "RankWeight_resultFiltertId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_userId_fkey";

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "rank";

-- AlterTable
ALTER TABLE "VoteConfig" DROP COLUMN "hasRankChoices",
DROP COLUMN "isCumulative",
ADD COLUMN     "instructions" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VoterManagement" DROP COLUMN "hasExternalCsvImport",
DROP COLUMN "hasGeneration",
DROP COLUMN "hasInternalCsvImport",
DROP COLUMN "hasRegistration";

-- DropTable
DROP TABLE "RankWeight";

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_externalVoterId_voteEventId_fkey" FOREIGN KEY ("externalVoterId", "voteEventId") REFERENCES "ExternalVoter"("id", "voteEventId") ON DELETE CASCADE ON UPDATE CASCADE;
