/*
  Warnings:

  - A unique constraint covering the columns `[userId,announcementId]` on the table `AnnouncementReadLog` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AnnouncementComment" DROP CONSTRAINT "AnnouncementComment_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "AnnouncementReadLog" DROP CONSTRAINT "AnnouncementReadLog_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "AnnouncementReadLog" DROP CONSTRAINT "AnnouncementReadLog_userId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReadLog_userId_announcementId_key" ON "AnnouncementReadLog"("userId", "announcementId");

-- AddForeignKey
ALTER TABLE "AnnouncementComment" ADD CONSTRAINT "AnnouncementComment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReadLog" ADD CONSTRAINT "AnnouncementReadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReadLog" ADD CONSTRAINT "AnnouncementReadLog_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
