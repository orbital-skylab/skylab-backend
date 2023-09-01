import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  createAnnouncement,
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
  CreateAnnouncementValidator,
  GetAnnouncementsValidator,
} from "src/validators/announcement.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

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
      const announcements = await getManyAnnouncementsWithFilter(req.query);
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

export default router;
