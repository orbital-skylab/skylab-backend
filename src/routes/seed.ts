import { Router, Request, Response } from "express";
import { seedAll } from "src/seed/seed.index";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.post("/", async (_: Request, res: Response) => {
  try {
    await seedAll();
    return apiResponseWrapper(res, { response: "Donezo" });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
