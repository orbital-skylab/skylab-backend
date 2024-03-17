// forumPosts.helper.ts
import { ForumCategory } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Prisma } from "@prisma/client";
import {
  findManyForumPosts,
  getOneForumPostById,
  createOneForumPost,
  updateForumPost,
} from "src/models/forumposts.db";

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

export async function fetchOneForumPostById(postId: number) {
  try {
    const forumPost = await getOneForumPostById(postId);

    if (!forumPost) {
      throw new SkylabError("Post not found", HttpStatusCode.NOT_FOUND);
    }

    return forumPost;
  } catch (error) {
    throw error;
  }
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
