import { Router, Request, Response } from "express";
import { getSubmissionsByDeadlineId } from "src/helpers/dashboard.admin.helper";
import authorizeAdmin from "src/middleware/authorizeAdmin";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get(
  "/team-submissions",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    try {
      const submissions = await getSubmissionsByDeadlineId(req.query);
      return apiResponseWrapper(res, { submissions: submissions });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
