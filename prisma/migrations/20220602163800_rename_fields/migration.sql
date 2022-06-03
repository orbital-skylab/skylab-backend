-- DropIndex
DROP INDEX "Administrator_userId_key";

-- AlterTable
ALTER TABLE "Administrator" ADD CONSTRAINT "Administrator_pkey" PRIMARY KEY ("userId");
