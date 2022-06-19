import { Request, Response, Router } from "express";
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
      return apiResponseWrapper(res, createdDeadline);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .get("/", async (req: Request, res: Response) => {
    try {
      const deadlines = await getFilteredDeadlines(req.query);
      return apiResponseWrapper(res, deadlines);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

router
  .get("/:deadlineId/questions", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const deadlineWithQuestions = await getAllQuestionsOfDeadline(deadlineId);
      return res.status(HttpStatusCode.OK).json(deadlineWithQuestions);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .put("/:deadlineId/questions", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;

    if (!req.body.questions) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json("Parameters missing from request");
    }
    try {
      await replaceQuestionsOfDeadline(deadlineId, req.body.questions);
      return res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

router
  .get("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;

    try {
      const deadline = await getDeadlineById(deadlineId);
      return res.status(HttpStatusCode.OK).json(deadline);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .put("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    const { deadline } = req.body;

    try {
      const updatedDeadline = await updateOneDeadline(deadlineId, deadline);
      return res.status(HttpStatusCode.OK).json(updatedDeadline);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete("/:deadlineId", async (req: Request, res: Response) => {
    const { deadlineId } = req.params;
    try {
      const deletedDeadline = await deleteDeadlineById(deadlineId);
      return res.status(HttpStatusCode.OK).json(deletedDeadline);
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/:deadlineId", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

export default router;
