-- CreateTable
CREATE TABLE "Option" (
    "questionId" INTEGER NOT NULL,
    "option" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Option_questionId_option_key" ON "Option"("questionId", "option");

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
