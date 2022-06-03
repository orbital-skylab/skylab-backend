/*
  Warnings:

  - You are about to drop the `Milestones` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Milestones" DROP CONSTRAINT "Milestones_projectId_fkey";

-- DropTable
DROP TABLE "Milestones";

-- CreateTable
CREATE TABLE "Milestone" (
    "milestoneNo" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "logUrl" TEXT NOT NULL,
    "readmeUrl" TEXT NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("milestoneNo","projectId")
);

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
