import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { prisma } from "src/client";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

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
