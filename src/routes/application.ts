import { Request, Response, Router } from "express";
import {
  approveOneApplication,
  createOneApplicationSubmission,
  getAllSubmissionsForLatestApplicationWithFilter,
  getLatestApplication,
  rejectOneApplication,
  withdrawOneApplication,
} from "../helpers/application.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import authorizeNotSignedIn from "../middleware/authorizeNotSignedIn";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";

const router = Router();

router.get("/all", async (req: Request, res: Response) => {
  try {
    const applications = await getAllSubmissionsForLatestApplicationWithFilter(
      req.query
    );

    return apiResponseWrapper(res, { applications });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.put(
  "/reject/:applicationSubmissionId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { applicationSubmissionId } = req.params;
    try {
      const application = await rejectOneApplication(
        Number(applicationSubmissionId)
      );

      return apiResponseWrapper(res, { application });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.put(
  "/approve/:applicationSubmissionId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { applicationSubmissionId } = req.params;
    try {
      const application = await approveOneApplication(
        Number(applicationSubmissionId)
      );

      return apiResponseWrapper(res, { application });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.delete(
  "/:applicationSubmissionId",
  authorizeAdmin,
  async (req: Request, res: Response) => {
    const { applicationSubmissionId } = req.params;
    try {
      const application = await withdrawOneApplication(
        Number(applicationSubmissionId)
      );

      return apiResponseWrapper(res, { application });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

router.get("/", authorizeNotSignedIn, async (_, res: Response) => {
  try {
    const latestApplication = await getLatestApplication();

    return apiResponseWrapper(res, { application: latestApplication });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.post("/", authorizeNotSignedIn, async (req: Request, res: Response) => {
  try {
    const createdApplication = await createOneApplicationSubmission(req.body);

    return apiResponseWrapper(res, { application: createdApplication });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
