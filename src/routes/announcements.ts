import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  createAnnouncement,
  createAnnouncementComment,
  getAnnouncementWithCommentThreads,
  getManyAnnouncementsWithFilter,
} from "src/helpers/announcements.helper";
import authorizeAdmin from "src/middleware/authorizeAdmin";
import authorizeRoleForAnnouncement from "src/middleware/authorizeRoleForAnnouncement";
import authorizeTargetAudienceRole from "src/middleware/authorizeTargetAudienceRole";
import { upsertOneAnnouncementReadLog } from "src/models/announcementReadLogs.db";
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
import jwt from "jsonwebtoken";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

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
      const token = req?.cookies?.token;
      if (!token || typeof token !== "string") {
        return res
          .status(HttpStatusCode.UNAUTHORIZED)
          .send("Authentication failed");
      }

      const jwtData = jwt.verify(
        token,
        process.env.JWT_SECRET ?? "jwt_secret"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
      const userId = jwtData.id;
      await upsertOneAnnouncementReadLog({
        where: {
          userId_announcementId: {
            userId: Number(userId),
            announcementId: Number(announcementId),
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          user: {
            connect: {
              id: Number(userId),
            },
          },
          announcement: {
            connect: {
              id: Number(announcementId),
            },
          },
        },
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

export default router;
