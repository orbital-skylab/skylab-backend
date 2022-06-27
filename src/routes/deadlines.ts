import { Request, Response, Router } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  createNewDeadline,
  deleteDeadlineById,
  getAllQuestionsOfDeadline,
  getDeadlineById,
  getFilteredDeadlines,
  replaceQuestionsOfDeadline,
  updateOneDeadline,
} from "src/helpers/deadline.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .post("/", async (req: Request, res: Response) => {
    try {
      const createdDeadline = await createNewDeadline(req.body);
      return apiResponseWrapper(res, { deadline: createdDeadline });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .get("/", async (req: Request, res: Response) => {
    try {
      const deadlines = await getFilteredDeadlines(req.query);
      return apiResponseWrapper(res, { deadlines: deadlines });
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
      const deadlineWithQuestions = await getAllQuestionsOfDeadline(deadlineId);
      return apiResponseWrapper(res, deadlineWithQuestions);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .put("/:deadlineId/questions", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;

    if (!req.body.questions) {
      throw new SkylabError(
        "Parameters missing from request body",
        HttpStatusCode.BAD_REQUEST
      );
    }
    try {
      const newQuestions = await replaceQuestionsOfDeadline(
        deadlineId,
        req.body.questions
      );
      return apiResponseWrapper(res, { questions: newQuestions });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

router
  .get("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;

    try {
      const deadline = await getDeadlineById(deadlineId);
      return apiResponseWrapper(res, { deadline: deadline });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .put("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    const { deadline } = req.body;

    try {
      const updatedDeadline = await updateOneDeadline(deadlineId, deadline);
      return apiResponseWrapper(res, { deadline: updatedDeadline });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const deletedDeadline = await deleteDeadlineById(deadlineId);
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
