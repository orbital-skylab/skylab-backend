import { Prisma, TargetAudienceRole } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneAnnouncement,
  getManyAnnouncements,
} from "src/models/announcements.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

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
      ...(search
        ? {
            OR: [
              {
                title: { contains: query.search, mode: "insensitive" },
              },
              {
                content: { contains: query.search, mode: "insensitive" },
              },
            ],
          }
        : {}),
      cohortYear: cohortYear,
      targetAudienceRole: targetAudienceRole ? targetAudienceRole : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: true,
      _count: {
        select: {
          announcementComments: true,
        },
      },
    },
  };

  const announcements = await getManyAnnouncements(announcementQuery);

  return announcements;
}

export async function createAnnouncement(body: {
  announcement: {
    cohortYear: number;
    title: string;
    content: string;
    shouldSendEmail: boolean;
    targetAudienceRole: TargetAudienceRole;
    authorId: number;
  };
}) {
  const { announcement: announcementData } = body;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cohortYear, authorId, shouldSendEmail, ...announcement } =
    announcementData;
  const createdAnnouncement = await createOneAnnouncement({
    data: {
      cohort: { connect: { academicYear: cohortYear } },
      author: { connect: { id: authorId } },
      ...announcement,
    },
  });

  if (!createdAnnouncement) {
    throw new SkylabError(
      "Error occurred while creating announcement",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  // TODO: Send email to target audience

  return createdAnnouncement;
}
