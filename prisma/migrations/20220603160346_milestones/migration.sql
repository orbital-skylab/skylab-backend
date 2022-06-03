-- DropIndex
DROP INDEX "Student_userId_key";

-- AlterTable
ALTER TABLE "Student" ADD CONSTRAINT "Student_pkey" PRIMARY KEY ("userId");

-- CreateTable
CREATE TABLE "Milestones" (
    "milestoneNo" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "logUrl" TEXT NOT NULL,
    "readmeUrl" TEXT NOT NULL,

    CONSTRAINT "Milestones_pkey" PRIMARY KEY ("milestoneNo","projectId")
);

-- AddForeignKey
ALTER TABLE "Milestones" ADD CONSTRAINT "Milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
