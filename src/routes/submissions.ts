import { Request, Response, Router } from "express";
import {
  createOneSubmission,
  getAnonymousAnswersViaAdviserID,
  getAnonymousAnswersViaStudentID,
  getSubmissionBySubmissionId,
  updateOneSubmissionBySubmissionId,
} from "src/helpers/submissions.helper";
import authorizeSignedIn from "src/middleware/authorizeSignedIn";
import authorizeSubmitter from "src/middleware/authorizeSubmitter";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.post("/", authorizeSignedIn, async (req: Request, res: Response) => {
  try {
    const createdSubmission = await createOneSubmission(req.body);
    return apiResponseWrapper(res, { submission: createdSubmission });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get(
  "/student/:studentId/anonymous-questions",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { studentId } = req.params;
    try {
      return apiResponseWrapper(res, {
        deadlines: await getAnonymousAnswersViaStudentID(Number(studentId)),
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get(
  "/adviser/:adviserId/anonymous-questions",
  authorizeSignedIn,
  async (req: Request, res: Response) => {
    const { adviserId } = req.params;
    try {
      return apiResponseWrapper(res, {
        deadlines: await getAnonymousAnswersViaAdviserID(Number(adviserId)),
      });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router
  .get(
    "/:submissionId",
    // authorizeSignedIn,
    async (req: Request, res: Response) => {
      const { submissionId } = req.params;
      try {
        const submission = await getSubmissionBySubmissionId(
          Number(submissionId)
        );
        return apiResponseWrapper(res, { submission: submission });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  )
  .put(
    "/:submissionId",
    authorizeSubmitter,
    async (req: Request, res: Response) => {
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
    }
  );

export default router;
