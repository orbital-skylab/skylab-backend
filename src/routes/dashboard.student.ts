import { Request, Response, Router } from "express";
import {
  getDeadlinesByStudentId,
  getPeerEvaluationFeedbackByStudentID,
} from "../helpers/dashboard.student.helper";
import authorizeSignedIn from "../middleware/authorizeSignedIn";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";

const router = Router();

router.get(
  "/:studentId/deadlines",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { studentId } = req.params;
    try {
      const deadlines = await getDeadlinesByStudentId(Number(studentId));
      return apiResponseWrapper(res, { deadlines: deadlines });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/:studentId/evaluations-feedbacks",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { studentId } = req.params;
    try {
      const peerEvaluationsFeedbacks =
        await getPeerEvaluationFeedbackByStudentID(Number(studentId));
      return apiResponseWrapper(res, { deadlines: peerEvaluationsFeedbacks });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
