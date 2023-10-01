import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { prisma } from "../client";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

export async function upsertOneAnnouncementReadLog(
  query: Prisma.AnnouncementReadLogUpsertArgs
) {
  try {
    const announcementReadLog = await prisma.announcementReadLog.upsert({
      ...query,
    });
    return announcementReadLog;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
}

export async function countAnnouncementReadLogs(
  query: Prisma.AnnouncementReadLogCountArgs
) {
  try {
    const count = await prisma.announcementReadLog.count({
      ...query,
    });
    return count;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
}
