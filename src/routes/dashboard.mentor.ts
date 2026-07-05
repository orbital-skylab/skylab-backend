import { Request, Response, Router } from "express";
import { getProjectMilestonesByMentorId } from "../helpers/dashboard.mentor";
import authorizeSelfRole from "../middleware/authorizeSelfRole";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";

const router = Router();
const authorizeSelfMentor = authorizeSelfRole("mentor", "mentorId");

router.get(
  "/:mentorId/submissions",
  authorizeSelfMentor,
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
