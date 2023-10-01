import { Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import { SkylabError } from "../errors/SkylabError";
import {
  createDeadline,
  deleteOneDeadlineByDeadlineId,
  duplicateDeadlineByDeadlineId,
  editDeadlineByDeadlineId,
  getAllQuestionsById,
  getManyDeadlinesWithFilter,
  getOneDeadlineById,
  replaceSectionsById,
} from "../helpers/deadline.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import {
  CreateDeadlineValidator,
  GetDeadlinesValidator,
} from "../validators/deadline.validator";
import { errorFormatter, throwValidationError } from "../validators/validator";

const router = Router();

router
  .get(
    "/",
    authorizeAdmin,
    GetDeadlinesValidator,
    async (req: Request, res: Response) => {
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
    }
  )
  .post(
    "/",
    authorizeAdmin,
    CreateDeadlineValidator,
    async (req: Request, res: Response) => {
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
    }
  )
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
  .get(
    "/:deadlineId/questions",
    authorizeAdmin,
    async (req: Request, res: Response) => {
      const { deadlineId } = req.params;
      try {
        const deadlineWithQuestions = await getAllQuestionsById(
          Number(deadlineId)
        );
        return apiResponseWrapper(res, deadlineWithQuestions);
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .put(
    "/:deadlineId/questions",
    authorizeAdmin,
    async (req: Request, res: Response) => {
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
    }
  );

router.post(
  "/:deadlineId/duplicate",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    const { deadline } = req.body;
    try {
      const duplicatedDeadline = await duplicateDeadlineByDeadlineId(
        Number(deadlineId),
        Number(deadline.cohortYear)
      );
      return apiResponseWrapper(res, { deadline: duplicatedDeadline });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router
  .get("/:deadlineId", authorizeAdmin, async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const deadlineWithId = await getOneDeadlineById(Number(deadlineId));
      return apiResponseWrapper(res, { deadline: deadlineWithId });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .put("/:deadlineId", authorizeAdmin, async (req: Request, res: Response) => {
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
  .delete(
    "/:deadlineId",
    authorizeAdmin,
    async (req: Request, res: Response) => {
      const { deadlineId } = req.params;
      try {
        const deletedDeadline = await deleteOneDeadlineByDeadlineId(
          Number(deadlineId)
        );
        return apiResponseWrapper(res, { deadline: deletedDeadline });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
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
