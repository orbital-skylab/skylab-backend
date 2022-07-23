import { Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "src/errors/SkylabError";
import {
  createDeadline,
  deleteOneDeadlineByDeadlineId,
  editDeadlineByDeadlineId,
  getAllQuestionsById,
  getManyDeadlinesWithFilter,
  getOneDeadlineById,
  replaceSectionsById,
} from "src/helpers/deadline.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  CreateDeadlineValidator,
  GetDeadlinesValidator,
} from "src/validators/deadline.validator";
import { errorFormatter, throwValidationError } from "src/validators/validator";

const router = Router();

router
  .get("/", GetDeadlinesValidator, async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const deadlines = await getManyDeadlinesWithFilter(req.query);
      return apiResponseWrapper(res, { deadlines: deadlines });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .post("/", CreateDeadlineValidator, async (req: Request, res: Response) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return throwValidationError(res, errors);
    }
    try {
      const createdDeadline = await createDeadline(req.body);
      return apiResponseWrapper(res, { deadline: createdDeadline });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

router
  .get("/:deadlineId/questions", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const deadlineWithQuestions = await getAllQuestionsById(
        Number(deadlineId)
      );
      return apiResponseWrapper(res, deadlineWithQuestions);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .put("/:deadlineId/questions", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const updatedDeadline = await replaceSectionsById(
        Number(deadlineId),
        req.body.sections
      );
      return apiResponseWrapper(res, { deadline: updatedDeadline });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

router
  .get("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const deadlineWithId = await getOneDeadlineById(Number(deadlineId));
      return apiResponseWrapper(res, { deadline: deadlineWithId });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .put("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const updatedDeadline = await editDeadlineByDeadlineId(
        Number(deadlineId),
        req.body
      );
      return apiResponseWrapper(res, { deadline: updatedDeadline });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const deletedDeadline = await deleteOneDeadlineByDeadlineId(
        Number(deadlineId)
      );
      return apiResponseWrapper(res, { deadline: deletedDeadline });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/:deadlineId", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

export default router;
