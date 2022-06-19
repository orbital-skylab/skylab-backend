import { Router, Request, Response } from "express";
import { getFilteredMentors, getMentorById } from "src/helpers/mentors.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const mentors = await getFilteredMentors(req.query);
    return apiResponseWrapper(res, { mentors: mentors });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:mentorId", async (req: Request, res: Response) => {
  const { mentorId } = req.params;
  try {
    const mentor = await getMentorById(mentorId);
    return apiResponseWrapper(res, { mentor: mentor });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
