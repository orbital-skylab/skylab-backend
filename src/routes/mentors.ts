import { Router, Request, Response } from "express";
import {
  getManyMentorsWithFilter,
  getOneMentorById,
} from "src/helpers/mentors.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const mentors = await getManyMentorsWithFilter(req.query);
    return apiResponseWrapper(res, { mentors: mentors });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:mentorId", async (req: Request, res: Response) => {
  const { mentorId } = req.params;
  try {
    const mentor = await getOneMentorById(Number(mentorId));
    return apiResponseWrapper(res, { mentor: mentor });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
