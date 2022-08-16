import { Request, Response, Router } from "express";
import {
  getDeadlinesByAdviserId,
  getProjectSubmissionsViaAdviserId,
} from "src/helpers/dashboard.adviser.helper";
import authorizeSignedIn from "src/middleware/authorizeSignedIn";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get(
  "/:adviserId/deadlines",
  // authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { adviserId } = req.params;
    try {
      const deadlines = await getDeadlinesByAdviserId(Number(adviserId));
      return apiResponseWrapper(res, { deadlines: deadlines });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/:adviserId/submissions",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { adviserId } = req.params;
    try {
      const submissions = await getProjectSubmissionsViaAdviserId(
        Number(adviserId)
      );
      return apiResponseWrapper(res, { deadlines: submissions });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
