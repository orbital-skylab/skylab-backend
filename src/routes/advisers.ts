import { Router, Request, Response } from "express";
import {
  getAdviserById,
  getFilteredAdvisers,
} from "src/helpers/advisers.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const advisers = await getFilteredAdvisers(req.query);
    return apiResponseWrapper(res, { advisers: advisers });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:adviserId", async (req: Request, res: Response) => {
  const { adviserId } = req.params;
  try {
    const adviser = await getAdviserById(adviserId);
    return apiResponseWrapper(res, { adviser: adviser });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
