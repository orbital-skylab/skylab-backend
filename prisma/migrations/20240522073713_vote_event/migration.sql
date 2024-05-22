-- CreateEnum
CREATE TYPE "DisplayType" AS ENUM ('None', 'Table', 'Gallery');

-- CreateTable
CREATE TABLE "VoteEvent" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),

    CONSTRAINT "VoteEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterManagement" (
    "voteEventId" INTEGER NOT NULL,
    "hasInternalList" BOOLEAN NOT NULL,
    "hasRegistration" BOOLEAN NOT NULL,
    "hasInternalCsvImport" BOOLEAN NOT NULL,
    "hasExternalList" BOOLEAN NOT NULL,
    "hasGeneration" BOOLEAN NOT NULL,
    "hasExternalCsvImport" BOOLEAN NOT NULL,
    "isRegistrationOpen" BOOLEAN NOT NULL,

    CONSTRAINT "VoterManagement_pkey" PRIMARY KEY ("voteEventId")
);

-- CreateTable
CREATE TABLE "VoteConfig" (
    "voteEventId" INTEGER NOT NULL,
    "maxVotes" INTEGER NOT NULL,
    "minVotes" INTEGER NOT NULL,
    "isRandomOrder" BOOLEAN NOT NULL,
    "isCumulative" BOOLEAN NOT NULL,
    "hasRankChoices" BOOLEAN NOT NULL,
    "displayType" "DisplayType" NOT NULL,

    CONSTRAINT "VoteConfig_pkey" PRIMARY KEY ("voteEventId")
);

-- CreateTable
CREATE TABLE "ResultsFilter" (
    "voteEventId" INTEGER NOT NULL,
    "areResultsPublished" BOOLEAN NOT NULL,
    "displayLimit" INTEGER NOT NULL,
    "showRank" BOOLEAN NOT NULL,
    "showPoints" BOOLEAN NOT NULL,
    "showPercentage" BOOLEAN NOT NULL,
    "studentWeight" DOUBLE PRECISION NOT NULL,
    "advisorWeight" DOUBLE PRECISION NOT NULL,
    "mentorWeight" DOUBLE PRECISION NOT NULL,
    "administratorWeight" DOUBLE PRECISION NOT NULL,
    "publicWeight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ResultsFilter_pkey" PRIMARY KEY ("voteEventId")
);

-- CreateTable
CREATE TABLE "ExternalVoter" (
    "id" TEXT NOT NULL,
    "voteEventId" INTEGER NOT NULL,

    CONSTRAINT "ExternalVoter_pkey" PRIMARY KEY ("id","voteEventId")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "voteEventId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER,
    "externalVoterId" TEXT,
    "rank" INTEGER,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankWeight" (
    "id" SERIAL NOT NULL,
    "resultFiltertId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RankWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserToVoteEvent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ProjectToVoteEvent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserToVoteEvent_AB_unique" ON "_UserToVoteEvent"("A", "B");

-- CreateIndex
CREATE INDEX "_UserToVoteEvent_B_index" ON "_UserToVoteEvent"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToVoteEvent_AB_unique" ON "_ProjectToVoteEvent"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectToVoteEvent_B_index" ON "_ProjectToVoteEvent"("B");

-- AddForeignKey
ALTER TABLE "VoterManagement" ADD CONSTRAINT "VoterManagement_voteEventId_fkey" FOREIGN KEY ("voteEventId") REFERENCES "VoteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteConfig" ADD CONSTRAINT "VoteConfig_voteEventId_fkey" FOREIGN KEY ("voteEventId") REFERENCES "VoteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultsFilter" ADD CONSTRAINT "ResultsFilter_voteEventId_fkey" FOREIGN KEY ("voteEventId") REFERENCES "VoteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalVoter" ADD CONSTRAINT "ExternalVoter_voteEventId_fkey" FOREIGN KEY ("voteEventId") REFERENCES "VoteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voteEventId_fkey" FOREIGN KEY ("voteEventId") REFERENCES "VoteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankWeight" ADD CONSTRAINT "RankWeight_resultFiltertId_fkey" FOREIGN KEY ("resultFiltertId") REFERENCES "ResultsFilter"("voteEventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToVoteEvent" ADD CONSTRAINT "_UserToVoteEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToVoteEvent" ADD CONSTRAINT "_UserToVoteEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "VoteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToVoteEvent" ADD CONSTRAINT "_ProjectToVoteEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToVoteEvent" ADD CONSTRAINT "_ProjectToVoteEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "VoteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
