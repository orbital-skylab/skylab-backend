import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { getManyAnnouncementsWithFilter } from "src/helpers/announcements.helper";
import authorizeTargetAudienceRole from "src/middleware/authorizeTargetAudienceRole";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { GetAnnouncementsValidator } from "src/validators/announcement.validator";
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
      const users = await getManyAnnouncementsWithFilter(req.query);
      return apiResponseWrapper(res, { users: users });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  }
);
