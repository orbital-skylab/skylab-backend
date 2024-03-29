import { Request, Response, Router } from "express";
import { getProjectMilestonesByMentorId } from "../helpers/dashboard.mentor";
import authorizeSignedIn from "../middleware/authorizeSignedIn";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";

const router = Router();

router.get(
  "/:mentorId/submissions",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { mentorId } = req.params;
    try {
      const deadlines = await getProjectMilestonesByMentorId(Number(mentorId));
      return apiResponseWrapper(res, { deadlines: deadlines });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
