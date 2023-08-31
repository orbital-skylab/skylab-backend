import { Prisma } from "@prisma/client";
import { getManyAnnouncements } from "src/models/announcements.db";

export async function getManyAnnouncementsWithFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any & {
    cohortYear: number;
    search?: string;
    targetAudienceRole?: string;
  }
) {
  const { cohortYear, search, targetAudienceRole } = query;
  /* Create Filter Object */
  const announcementQuery: Prisma.AnnouncementFindManyArgs = {
    where: {
      OR: [
        {
          title: search
            ? { contains: query.search, mode: "insensitive" }
            : undefined,
        },
        {
          content: search
            ? { contains: query.search, mode: "insensitive" }
            : undefined,
        },
      ],
      cohortYear: cohortYear,
      targetAudienceRole: targetAudienceRole ? targetAudienceRole : undefined,
    },
  };

  const announcements = await getManyAnnouncements(announcementQuery);

  return announcements;
}
