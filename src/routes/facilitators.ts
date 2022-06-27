import { Request, Response, Router } from "express";
import {
  getFacilitatorById,
  getFilteredFacilitators,
} from "src/helpers/facilitators.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const facilitators = await getFilteredFacilitators(req.query);
    return apiResponseWrapper(res, { facilitators: facilitators });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:facilitatorId", async (req: Request, res: Response) => {
  const { facilitatorId } = req.params;
  try {
    const facilitator = await getFacilitatorById(facilitatorId);
    return apiResponseWrapper(res, { facilitator: facilitator });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
