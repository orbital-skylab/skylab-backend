/*
  Warnings:

  - You are about to drop the column `github_url` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin_url` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `matric_no` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nusnet_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `personal_site_url` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profile_pic_url` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `self_intro` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "github_url",
DROP COLUMN "linkedin_url",
DROP COLUMN "matric_no",
DROP COLUMN "nusnet_id",
DROP COLUMN "personal_site_url",
DROP COLUMN "profile_pic_url",
DROP COLUMN "self_intro",
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "matricNo" VARCHAR(40),
ADD COLUMN     "nusnetId" VARCHAR(40),
ADD COLUMN     "personalSiteUrl" TEXT,
ADD COLUMN     "profilePicUrl" TEXT,
ADD COLUMN     "selfIntro" TEXT;
