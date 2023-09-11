import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  createAnnouncement,
  createAnnouncementComment,
  deleteOrSoftDeleteAnnouncementComment,
  editAnnouncement,
  editAnnouncementComment,
  getAnnouncementWithCommentThreads,
  getManyAnnouncementsWithFilter,
} from "src/helpers/announcements.helper";
import authorizeAdmin from "src/middleware/authorizeAdmin";
import authorizeRoleForAnnouncement from "src/middleware/authorizeRoleForAnnouncement";
import authorizeTargetAudienceRole from "src/middleware/authorizeTargetAudienceRole";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import {
  CreateAnnouncementCommentValidator,
  CreateAnnouncementValidator,
  GetAnnouncementsValidator,
} from "src/validators/announcement.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";
import {
  createAnnouncementReadLog,
  getAnnouncementReadPercentage,
} from "src/helpers/announcementReadLogs.helper";
import { extractJwtData } from "src/helpers/authentication.helper";
import { deleteAnnouncement } from "src/models/announcements.db";
import authorizeAuthorOfComment from "src/middleware/authorizeAuthorOfComment";

const router = Router();

router.get(
  "/",
  authorizeTargetAudienceRole,
  GetAnnouncementsValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const { id: userId } = extractJwtData(req, res);
      const announcements = await getManyAnnouncementsWithFilter({
        query: req.query,
        userId: Number(userId),
      });
      return apiResponseWrapper(res, { announcements });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/:announcementId",
  authorizeRoleForAnnouncement,
  async (req: Request, res: Response) => {
    const { announcementId } = req.params;
    try {
      const { id: userId } = extractJwtData(req, res);

      await createAnnouncementReadLog({
        userId: Number(userId),
        announcementId: Number(announcementId),
      });

      const announcement = await getAnnouncementWithCommentThreads({
        announcementId: Number(announcementId),
      });
      return apiResponseWrapper(res, { announcement });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post(
  "/",
  authorizeAdmin,
  CreateAnnouncementValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const createdAnnouncement = await createAnnouncement(req.body);
      return apiResponseWrapper(res, { announcement: createdAnnouncement });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.put(
  "/:announcementId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { announcementId } = req.params;
    try {
      const editedAnnouncement = await editAnnouncement({
        body: req.body,
        announcementId: Number(announcementId),
      });
      return apiResponseWrapper(res, { announcement: editedAnnouncement });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.delete("/:announcementId", authorizeAdmin, async (req, res) => {
  const { announcementId } = req.params;
  try {
    const deletedAnnouncement = await deleteAnnouncement({
      where: { id: Number(announcementId) },
    });
    return apiResponseWrapper(res, { announcement: deletedAnnouncement });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

/**
 * Comments
 */
router.post(
  "/:announcementId/comments",
  authorizeRoleForAnnouncement,
  CreateAnnouncementCommentValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    const { announcementId } = req.params;
    try {
      const createdAnnouncementComment = await createAnnouncementComment({
        body: req.body,
        announcementId: Number(announcementId),
      });
      return apiResponseWrapper(res, { comment: createdAnnouncementComment });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.put(
  "/:announcementId/comments/:commentId",
  authorizeAuthorOfComment,
  async (req, res) => {
    const { commentId } = req.params;
    try {
      const editedAnnouncementComment = await editAnnouncementComment({
        body: req.body,
        commentId: Number(commentId),
      });
      return apiResponseWrapper(res, { comment: editedAnnouncementComment });
    } catch (error) {
      return routeErrorHandler(res, error);
    }
  }
);

router.delete(
  "/:announcementId/comments/:commentId",
  authorizeAuthorOfComment,
  async (req, res) => {
    const { commentId } = req.params;
    try {
      const deletedAnnouncementComment =
        await deleteOrSoftDeleteAnnouncementComment({
          commentId: Number(commentId),
        });
      return apiResponseWrapper(res, { comment: deletedAnnouncementComment });
    } catch (error) {
      return routeErrorHandler(res, error);
    }
  }
);

/**
 * Read log
 */
router.get(
  "/:announcementId/read-percentage",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { announcementId } = req.params;
    try {
      const readPercentage = await getAnnouncementReadPercentage({
        announcementId: Number(announcementId),
      });
      return apiResponseWrapper(res, {
        readPercentage,
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post(
  "/:announcementId/read",
  authorizeRoleForAnnouncement,
  async (req: Request, res: Response) => {
    const { announcementId } = req.params;
    try {
      const { id: userId } = extractJwtData(req, res);
      const createdAnnouncementReadLog = await createAnnouncementReadLog({
        userId: Number(userId),
        announcementId: Number(announcementId),
      });
      return apiResponseWrapper(res, {
        announcementReadLog: createdAnnouncementReadLog,
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
