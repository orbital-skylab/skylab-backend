-- CreateTable
CREATE TABLE "Answerable" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Answerable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "submissionId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "AnonymousApplicant" (
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "matricNo" TEXT NOT NULL,
    "nusnetId" TEXT NOT NULL,
    "deadlineId" INTEGER NOT NULL,
    "applicationSubmissionId" INTEGER NOT NULL,

    CONSTRAINT "AnonymousApplicant_pkey" PRIMARY KEY ("deadlineId","matricNo")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_submissionId_key" ON "Application"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousApplicant_deadlineId_nusnetId_key" ON "AnonymousApplicant"("deadlineId", "nusnetId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousApplicant" ADD CONSTRAINT "AnonymousApplicant_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousApplicant" ADD CONSTRAINT "AnonymousApplicant_applicationSubmissionId_fkey" FOREIGN KEY ("applicationSubmissionId") REFERENCES "Application"("submissionId") ON DELETE RESTRICT ON UPDATE CASCADE;
