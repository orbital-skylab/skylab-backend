import { Request, Response, Router } from "express";
import {
  getDeadlinesByAdviserId,
  getProjectSubmissionsViaAdviserId,
} from "../helpers/dashboard.adviser.helper";
import authorizeSelfRole from "../middleware/authorizeSelfRole";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";

const router = Router();
const authorizeSelfAdviser = authorizeSelfRole("adviser", "adviserId");

router.get(
  "/:adviserId/deadlines",
  authorizeSelfAdviser,
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
  authorizeSelfAdviser,
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
