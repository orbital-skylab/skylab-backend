import { Router, Request, Response } from "express";
import {
  getManyForumPostsWithFilter,
  getForumPostWithCommentThreads,
  createForumPost,
  editForumPost,
  createForumPostComment,
  editForumComment,
  deleteOrSoftDeleteForumComment,
  stickyForumPost,
} from "../helpers/forumPosts.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { extractJwtData } from "../helpers/authentication.helper";
import { deleteForumPost } from "src/models/forumposts.db";
import authorizeTargetAudienceRole from "../middleware/authorizeTargetAudienceRole";
import authorizeAuthorOfPostComment from "src/middleware/authorizeAuthorOfPostComment";
import authorizeAuthorOfPost from "src/middleware/authorizeAuthorOfPost";
import authorizeAdmin from "src/middleware/authorizeAdmin";

const router = Router();

// Get all forum posts
router.get(
  "/",
  authorizeTargetAudienceRole,
  async (req: Request, res: Response) => {
    try {
      const { id: userId } = extractJwtData(req, res);
      const forumPosts = await getManyForumPostsWithFilter({
        query: req.query,
        userId: Number(userId),
      });
      return apiResponseWrapper(res, { forumPosts: forumPosts });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

// Get forum post using id
router.get("/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    const forumPost = await getForumPostWithCommentThreads({
      postId: Number(postId),
    });
    return apiResponseWrapper(res, { forumPost });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const createdForumPost = await createForumPost(req.body);
    return apiResponseWrapper(res, { forumpost: createdForumPost });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.delete("/:postId", authorizeAuthorOfPost, async (req, res) => {
  const { postId } = req.params;
  try {
    const deletedforumPost = await deleteForumPost({
      where: { id: Number(postId) },
    });
    return apiResponseWrapper(res, { forumPost: deletedforumPost });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.put(
  "/:postId",
  authorizeAuthorOfPost,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    try {
      const editedForumPost = await editForumPost({
        updateData: req.body,
        postId: Number(postId),
      });
      return apiResponseWrapper(res, { forumpost: editedForumPost });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post("/:postId/comments", async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    const createdPostComment = await createForumPostComment({
      body: req.body,
      postId: Number(postId),
    });
    return apiResponseWrapper(res, { comment: createdPostComment });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.put(
  "/:postId/comments/:commentId",
  authorizeAuthorOfPostComment,
  async (req, res) => {
    const { commentId } = req.params;
    try {
      const editedForumComment = await editForumComment({
        body: req.body,
        commentId: Number(commentId),
      });
      return apiResponseWrapper(res, { comment: editedForumComment });
    } catch (error) {
      return routeErrorHandler(res, error);
    }
  }
);

router.delete(
  "/:announcementId/comments/:commentId",
  authorizeAuthorOfPostComment,
  async (req, res) => {
    const { commentId } = req.params;
    try {
      const deletedPostComment = await deleteOrSoftDeleteForumComment({
        commentId: Number(commentId),
      });
      return apiResponseWrapper(res, { comment: deletedPostComment });
    } catch (error) {
      return routeErrorHandler(res, error);
    }
  }
);

router.put(
  "/sticky/:postId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    try {
      const editedForumPost = await stickyForumPost({
        postId: Number(postId),
      });
      return apiResponseWrapper(res, { forumpost: editedForumPost });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
