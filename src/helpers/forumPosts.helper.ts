// forumPosts.helper.ts
import { ForumCategory, ForumComment } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Prisma } from "@prisma/client";
import {
  findManyForumPosts,
  getOneForumPostById,
  createOneForumPost,
  updateForumPost,
  createOneForumPostComment,
} from "src/models/forumposts.db";

export async function getForumPostWithCommentThreads({
  postId,
}: {
  postId: number;
}) {
  const forumPost = await getOneForumPostById({ postId });

  const { forumComments, ...rest } = forumPost;

  const commentThreads = organizeCommentsIntoThreads(forumComments);

  return { ...rest, postCommentThreads: commentThreads };
}

function organizeCommentsIntoThreads(forumpostComments: ForumComment[]) {
  const commentMap = new Map<ForumComment["id"], ForumComment[]>();

  forumpostComments.forEach((comment) => {
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

export async function getManyForumPostsWithFilter({
  query,
  userId,
}: {
  query: any & {
    category?: ForumCategory | "YourPosts";
  };
  userId: number;
}) {
  const { category } = query;

  // If the category is 'All', we don't apply any category filter.
  // If the category is 'YourPosts', we filter by the provided userId.
  let whereCondition = {};

  if (category && category !== "All") {
    if (category === "YourPosts") {
      whereCondition = {
        userId: { equals: userId },
      };
    } else {
      whereCondition = {
        OR: [{ category: { equals: category } }],
      };
    }
  }

  const forumPostQuery: Prisma.ForumPostFindManyArgs = {
    where: whereCondition,
    include: {
      user: {
        select: {
          profilePicUrl: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  };

  const forumPosts = await findManyForumPosts(forumPostQuery);
  return forumPosts;
}

export async function createForumPost(postData: {
  title: string;
  body: string;
  category: ForumCategory;
  userId: number;
}) {
  try {
    const createdForumPost = await createOneForumPost({
      data: {
        title: postData.title,
        body: postData.body,
        category: postData.category,
        user: { connect: { id: postData.userId } },
      },
    });

    return createdForumPost;
  } catch (error) {
    throw error;
  }
}

export async function editForumPost({
  postId,
  updateData,
}: {
  postId: number;
  updateData: {
    title?: string;
    body?: string;
    category?: ForumCategory;
  };
}) {
  try {
    const updatedForumPost = await updateForumPost({
      where: {
        id: postId,
      },
      data: {
        ...updateData,
      },
    });

    return updatedForumPost;
  } catch (error) {
    // Handle unexpected errors
    throw new SkylabError(
      "Error occurred while updating post",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

export async function createForumPostComment({
  body,
  postId,
}: {
  body: {
    comment: {
      content: string;
      userId: number;
      parentCommentId?: number;
    };
  };
  postId: number;
}) {
  const { content, userId, parentCommentId } = body.comment;

  const createdComment = await createOneForumPostComment({
    data: {
      content,
      user: {
        connect: {
          id: userId,
        },
      },
      forumPost: {
        connect: {
          id: postId,
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
