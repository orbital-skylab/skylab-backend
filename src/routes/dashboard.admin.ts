import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  getSubmissions,
  getAllEvaluationSubmissions,
  sendReminderEmail,
} from "../helpers/dashboard.admin.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { GetSubmissionsByDeadlineIDValidator } from "../validators/dashboard.admin.validator";
import { errorFormatter, throwValidationError } from "../validators/validator";

const router = Router();

router.get(
  "/team-submissions",
  authorizeAdmin,
  GetSubmissionsByDeadlineIDValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const submissions = await getSubmissions(req.query);
      return apiResponseWrapper(res, { submissions: submissions });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.post("/send-reminders", async (req: Request, res: Response) => {
  try {
    const { emails, ccs, subject, message } = req.body;

    sendReminderEmail(emails, ccs, subject, message);

    return apiResponseWrapper(res, {});
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get(
  "/evaluations",
  authorizeAdmin,
  GetSubmissionsByDeadlineIDValidator, // Reuse the same validator!
  async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const submissions = await getAllEvaluationSubmissions(req.query);
      return apiResponseWrapper(res, { submissions: submissions });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
