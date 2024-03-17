import { Router, Request, Response } from "express";
import {
  getManyForumPostsWithFilter,
  fetchOneForumPostById,
  createForumPost,
  editForumPost,
} from "../helpers/forumPosts.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { extractJwtData } from "../helpers/authentication.helper";
import { deleteForumPost } from "src/models/forumposts.db";

const router = Router();

// Get all forum posts
router.get("/", async (req: Request, res: Response) => {
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
});

// Get forum post using id
router.get("/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;

  try {
    const postWithId = await fetchOneForumPostById(Number(postId));
    return apiResponseWrapper(res, { forumPost: postWithId });
  } catch (e) {
    routeErrorHandler(res, e);
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

router.delete("/:postId", async (req, res) => {
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

router.put("/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    const editedForumPost = await editForumPost({
      updateData: req.body,
      postId: Number(postId),
    });
    return apiResponseWrapper(res, { announcement: editedForumPost });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
