import { Router, Request, Response } from "express";
import { getSubmissionsByDeadlineId } from "src/helpers/dashboard.admin.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get("/team-submissions", async (req: Request, res: Response) => {
  try {
    const submissions = await getSubmissionsByDeadlineId(req.query);
    return apiResponseWrapper(res, { submissions: submissions });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
