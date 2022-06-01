-- CreateTable
CREATE TABLE "Administrator" (
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Administrator_userId_key" ON "Administrator"("userId");

-- AddForeignKey
ALTER TABLE "Administrator" ADD CONSTRAINT "Administrator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
