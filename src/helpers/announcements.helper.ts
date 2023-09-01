import {
  AnnouncementComment,
  Prisma,
  TargetAudienceRole,
} from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneAnnouncement,
  getManyAnnouncements,
  getOneAnnouncementWithComments,
} from "src/models/announcements.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export async function getAnnouncementWithCommentThreads({
  announcementId,
}: {
  announcementId: number;
}) {
  const announcement = await getOneAnnouncementWithComments({ announcementId });

  const { announcementComments, ...rest } = announcement;

  const commentThreads = organizeCommentsIntoThreads(announcementComments);

  return { ...rest, announcementCommentThreads: commentThreads };
}

function organizeCommentsIntoThreads(
  announcementComments: AnnouncementComment[]
) {
  const commentMap = new Map<
    AnnouncementComment["id"],
    AnnouncementComment[]
  >();

  announcementComments.forEach((comment) => {
    const { id, parentCommentId } = comment;

    // Root-level comment
    if (!parentCommentId) {
      if (commentMap.has(id)) {
        commentMap.get(id)?.push(comment);
      } else {
        commentMap.set(id, [comment]);
      }
    } else {
      // Child-level comment
      if (commentMap.has(parentCommentId)) {
        commentMap.get(parentCommentId)?.push(comment);
      } else {
        commentMap.set(parentCommentId, [comment]);
      }
    }
  });

  // Sort comments within threads in chronological order
  for (const [rootCommentId, comments] of commentMap.entries()) {
    const sortedComments = comments.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    commentMap.set(rootCommentId, sortedComments);
  }

  // Sort comment threads in reverse chronological order based on root comment
  const sortedCommentThreads = Array.from(commentMap.values()).sort((a, b) => {
    const aRootComment = a[0];
    const bRootComment = b[0];
    return (
      new Date(bRootComment.createdAt).getTime() -
      new Date(aRootComment.createdAt).getTime()
    );
  });

  return sortedCommentThreads;
}

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
