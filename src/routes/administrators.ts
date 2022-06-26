import { Router, Request, Response } from "express";
import {
  getFilteredAdministrators,
  getAdministratorById,
} from "src/helpers/administrators.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const administrators = await getFilteredAdministrators(req.query);
    return apiResponseWrapper(res, { administrators: administrators });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:administratorId", async (req: Request, res: Response) => {
  const { administratorId } = req.params;
  try {
    const administrator = await getAdministratorById(administratorId);
    return apiResponseWrapper(res, { administrator: administrator });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
