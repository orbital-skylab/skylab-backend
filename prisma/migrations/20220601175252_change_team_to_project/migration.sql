/*
  Warnings:

  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_adviserId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_cohortId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_mentorUserId_fkey";

-- DropTable
DROP TABLE "Team";

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "adviserId" INTEGER,
    "mentorUserId" INTEGER,
    "achievement" "AchievementLevel" NOT NULL,
    "cohortId" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES "Adviser"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "Mentor"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
