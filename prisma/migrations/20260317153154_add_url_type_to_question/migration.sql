-- CreateEnum
CREATE TYPE "UrlType" AS ENUM ('Image', 'Video', 'Generic');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "urlType" "UrlType";
