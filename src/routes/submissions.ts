import { Request, Response, Router } from "express";
import {
  createOneSubmission,
  getSubmissionBySubmissionId,
  updateOneSubmissionBySubmissionId,
} from "src/helpers/submissions.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const createdSubmission = await createOneSubmission(req.body);
    return apiResponseWrapper(res, { submission: createdSubmission });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router
  .get("/:submissionId", async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    try {
      const submission = await getSubmissionBySubmissionId(
        Number(submissionId)
      );
      return apiResponseWrapper(res, { submission: submission });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .put("/:submissionId", async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    try {
      const updatedSubmission = await updateOneSubmissionBySubmissionId(
        Number(submissionId),
        req.body
      );
      return apiResponseWrapper(res, { submission: updatedSubmission });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

export default router;
