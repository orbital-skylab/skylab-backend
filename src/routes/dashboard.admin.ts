import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { getSubmissionsByDeadlineId } from "src/helpers/dashboard.admin.helper";
import authorizeAdmin from "src/middleware/authorizeAdmin";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { GetSubmissionsByDeadlineIDValidator } from "src/validators/dashboard.admin.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

const router = Router();

router.get(
  "/team-submissions",
  // authorizeAdmin,
  GetSubmissionsByDeadlineIDValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const submissions = await getSubmissionsByDeadlineId(req.query);
      return apiResponseWrapper(res, { submissions: submissions });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
