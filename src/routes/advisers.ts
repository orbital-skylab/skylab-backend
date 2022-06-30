import { Router, Request, Response } from "express";
import {
  createNewAdviser,
  getAdviserById,
  getFilteredAdvisers,
} from "src/helpers/advisers.helper";
import { createManyAdvisers } from "src/models/advisers.db";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router
  .get("/", async (req: Request, res: Response) => {
    try {
      const advisers = await getFilteredAdvisers(req.query);
      return apiResponseWrapper(res, { advisers: advisers });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .post("/", async (req: Request, res: Response) => {
    try {
      const createdAdviser = await createNewAdviser(req.body);
      return apiResponseWrapper(res, { adviser: createdAdviser });
    } catch (e) {
      routeErrorHandler(res, e);
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

router.post("/batch", async (req: Request, res: Response) => {
  try {
    const createdAdvisers = await createManyAdvisers(req.body);
    return apiResponseWrapper(res, { advisers: createdAdvisers });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

export default router;
