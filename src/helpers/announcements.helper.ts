import {
  AnnouncementComment,
  Prisma,
  TargetAudienceRole,
} from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import {
  countComments,
  createOneAnnouncement,
  createOneAnnouncementComment,
  deleteAnnouncementComment,
  getManyAnnouncements,
  getOneAnnouncementWithComments,
  updateAnnouncement,
  updateAnnouncementComment,
} from "../models/announcements.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

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

export async function getManyAnnouncementsWithFilter({
  query,
  userId,
}: {
  query: any & {
    cohortYear: number;
    search?: string;
    targetAudienceRole?: string;
  };
  userId: number;
}) {
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
      announcementReadLogs: {
        where: {
          userId,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      },
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

  if (shouldSendEmail) {
    // TODO: Send email to target audience
  }

  return createdAnnouncement;
}

export async function editAnnouncement({
  body,
  announcementId,
}: {
  body: {
    announcement: {
      title?: string;
      content?: string;
      targetAudienceRole?: TargetAudienceRole;
    };
  };
  announcementId: number;
}) {
  const { announcement } = body;

  const updatedAnnouncement = await updateAnnouncement({
    where: {
      id: announcementId,
    },
    data: {
      ...announcement,
    },
  });

  if (!updatedAnnouncement) {
    throw new SkylabError(
      "Error occurred while updating announcement",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return updateAnnouncement;
}

export async function createAnnouncementComment({
  body,
  announcementId,
}: {
  body: {
    comment: {
      content: string;
      authorId: number;
      parentCommentId?: number;
    };
  };
  announcementId: number;
}) {
  const { content, authorId, parentCommentId } = body.comment;

  const createdComment = await createOneAnnouncementComment({
    data: {
      content,
      author: {
        connect: {
          id: authorId,
        },
      },
      announcement: {
        connect: {
          id: announcementId,
        },
      },
      ...(parentCommentId
        ? {
            parentComment: {
              connect: {
                id: parentCommentId,
              },
            },
          }
        : {}),
    },
  });

  if (!createdComment) {
    throw new SkylabError(
      "Error occurred while creating comment",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return createdComment;
}

export async function editAnnouncementComment({
  body,
  commentId,
}: {
  body: {
    comment: {
      content?: string;
    };
  };
  commentId: number;
}) {
  const { comment } = body;

  const updatedAnnouncementComment = await updateAnnouncementComment({
    where: {
      id: commentId,
    },
    data: {
      ...comment,
      deletedAt: null,
    },
  });

  if (!updatedAnnouncementComment) {
    throw new SkylabError(
      "Error occurred while updating comment",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return updateAnnouncement;
}

/**
 * If the comment has replies, the comment will be soft deleted and replaced with a placeholder comment.
 */
export async function deleteOrSoftDeleteAnnouncementComment({
  commentId,
}: {
  commentId: number;
}) {
  const hasReplies =
    (await countComments({
      where: {
        parentCommentId: commentId,
      },
    })) > 0;

  // Soft delete
  if (hasReplies) {
    const updatedAnnouncementComment = await updateAnnouncementComment({
      where: {
        id: commentId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (!updatedAnnouncementComment) {
      throw new SkylabError(
        "Error occurred while soft deleting comment",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    return updateAnnouncementComment;
  }

  // Hard-delete
  const deletedAnnouncementComment = await deleteAnnouncementComment({
    where: {
      id: commentId,
    },
  });

  if (!deletedAnnouncementComment) {
    throw new SkylabError(
      "Error occurred while deleting comment",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return deletedAnnouncementComment;
}
