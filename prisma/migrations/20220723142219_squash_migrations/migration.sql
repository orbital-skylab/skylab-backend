-- CreateEnum
CREATE TYPE "DeadlineType" AS ENUM ('Milestone', 'Evaluation', 'Feedback', 'Application', 'Other');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('ShortAnswer', 'Paragraph', 'MultipleChoice', 'Checkboxes', 'Dropdown', 'Url', 'Date', 'Time');

-- CreateEnum
CREATE TYPE "AchievementLevel" AS ENUM ('Vostok', 'Gemini', 'Apollo', 'Artemis');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "profilePicUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "personalSiteUrl" TEXT,
    "selfIntro" TEXT,
    "password" VARCHAR(255) NOT NULL,
    "submitterId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "academicYear" INTEGER NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("academicYear")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "nusnetId" VARCHAR(40),
    "matricNo" VARCHAR(40),
    "cohortYear" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adviser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nusnetId" TEXT,
    "matricNo" TEXT,
    "cohortYear" INTEGER NOT NULL,

    CONSTRAINT "Adviser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mentor" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cohortYear" INTEGER NOT NULL,

    CONSTRAINT "Mentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Administrator" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Administrator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "adviserId" INTEGER,
    "mentorId" INTEGER,
    "achievement" "AchievementLevel" NOT NULL,
    "cohortYear" INTEGER NOT NULL,
    "proposalPdf" TEXT,
    "posterUrl" TEXT,
    "videoUrl" TEXT,
    "teamName" TEXT,
    "hasDropped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cohortYear" INTEGER NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueBy" TIMESTAMP(3) NOT NULL,
    "desc" TEXT,
    "type" "DeadlineType" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "deadlineId" INTEGER NOT NULL,
    "milestoneId" INTEGER NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "sectionNumber" INTEGER NOT NULL,
    "deadlineId" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "questionId" INTEGER NOT NULL,
    "option" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "EvaluationRelation" (
    "id" SERIAL NOT NULL,
    "fromProjectId" INTEGER NOT NULL,
    "toProjectId" INTEGER NOT NULL,

    CONSTRAINT "EvaluationRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fromUserId" INTEGER,
    "toUserId" INTEGER,
    "fromProjectId" INTEGER,
    "toProjectId" INTEGER,
    "deadlineId" INTEGER NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "questionId" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "submissionId" INTEGER NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("submissionId","questionId","answer")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_nusnetId_key" ON "Student"("nusnetId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_matricNo_key" ON "Student"("matricNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_cohortYear_key" ON "Student"("userId", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Adviser_userId_cohortYear_key" ON "Adviser"("userId", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_userId_cohortYear_key" ON "Mentor"("userId", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_cohortYear_key" ON "Project"("name", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Deadline_name_cohortYear_key" ON "Deadline"("name", "cohortYear");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_deadlineId_key" ON "Evaluation"("deadlineId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_milestoneId_key" ON "Evaluation"("milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_deadlineId_sectionNumber_key" ON "Section"("deadlineId", "sectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Option_questionId_order_key" ON "Option"("questionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRelation_fromProjectId_toProjectId_key" ON "EvaluationRelation"("fromProjectId", "toProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_deadlineId_fromProjectId_toProjectId_toUserId_key" ON "Submission"("deadlineId", "fromProjectId", "toProjectId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_deadlineId_fromUserId_toProjectId_key" ON "Submission"("deadlineId", "fromUserId", "toProjectId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_cohortYear_fkey" FOREIGN KEY ("cohortYear") REFERENCES "Cohort"("academicYear") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adviser" ADD CONSTRAINT "Adviser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adviser" ADD CONSTRAINT "Adviser_cohortYear_fkey" FOREIGN KEY ("cohortYear") REFERENCES "Cohort"("academicYear") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentor" ADD CONSTRAINT "Mentor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentor" ADD CONSTRAINT "Mentor_cohortYear_fkey" FOREIGN KEY ("cohortYear") REFERENCES "Cohort"("academicYear") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administrator" ADD CONSTRAINT "Administrator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_cohortYear_fkey" FOREIGN KEY ("cohortYear") REFERENCES "Cohort"("academicYear") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES "Adviser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_cohortYear_fkey" FOREIGN KEY ("cohortYear") REFERENCES "Cohort"("academicYear") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRelation" ADD CONSTRAINT "EvaluationRelation_fromProjectId_fkey" FOREIGN KEY ("fromProjectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRelation" ADD CONSTRAINT "EvaluationRelation_toProjectId_fkey" FOREIGN KEY ("toProjectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_fromProjectId_fkey" FOREIGN KEY ("fromProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_toProjectId_fkey" FOREIGN KEY ("toProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
