import { Prisma } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { prisma } from "../client";

/**
 * Fetches forum posts from the database based on the given Prisma query conditions.
 *
 * @param query The Prisma query conditions to use for fetching forum posts.
 * @returns An array of forum post records that match the given query conditions.
 */
export const findManyForumPosts = async (
  query: Prisma.ForumPostFindManyArgs
) => {
  const forumPosts = await prisma.forumPost.findMany(query);
  return forumPosts;
};

/**
 * Retrieves a single forum post by ID from the database, including the posting user's profile picture URL and name.
 *
 * @param postId The ID of the forum post to retrieve.
 * @returns The forum post object if found, otherwise `null`.
 * @throws SkylabError with an appropriate error message and HTTP status code if an error occurs.
 */
export const getOneForumPostById = async ({ postId }: { postId }) => {
  const forumPost = await prisma.forumPost.findUnique({
    where: {
      id: postId,
    },
    include: {
      user: {
        select: {
          profilePicUrl: true,
          name: true,
        },
      },
      forumComments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicUrl: true,
            },
          },
        },
      },
    },
  });
  if (!forumPost) {
    throw new SkylabError(
      "Announcement was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }
  return forumPost;
};

/**
 * Creates a new forum post in the database with the specified data.
 *
 * @param query The data used for creating the forum post.
 * @returns The newly created forum post.
 * @throws SkylabError with an appropriate message and HTTP status code if creation fails.
 */
export async function createOneForumPost(query: Prisma.ForumPostCreateArgs) {
  try {
    const newForumPost = await prisma.forumPost.create(query);
    return newForumPost;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      throw new SkylabError(error.message, HttpStatusCode.BAD_REQUEST, error);
    }
    throw new SkylabError(
      "Error occurred while creating the forum post",
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error
    );
  }
}

export const deleteForumPost = async (query: Prisma.ForumPostDeleteArgs) => {
  try {
    return await prisma.forumPost.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const updateForumPost = async (query: Prisma.ForumPostUpdateArgs) => {
  try {
    return await prisma.forumPost.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const createOneForumPostComment = async (
  query: Prisma.ForumCommentCreateArgs
) => {
  try {
    const newForumPostComment = await prisma.forumComment.create(query);
    return newForumPostComment;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
