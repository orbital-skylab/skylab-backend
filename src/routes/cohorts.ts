import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  deleteCohortByYear,
  editCohortByYear,
  getCurrentCohort,
} from "src/helpers/cohorts.helper";
import authorizeAdmin from "src/middleware/authorizeAdmin";
import { createCohort, getManyCohorts } from "src/models/cohorts.db";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .get("/", async (_: Request, res: Response) => {
    try {
      const cohorts = await getManyCohorts({
        orderBy: [{ academicYear: "desc" }],
      });
      return apiResponseWrapper(res, { cohorts: cohorts });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .post("/", authorizeAdmin, async (req: Request, res: Response) => {
    if (!req.body.cohort) {
      throw new SkylabError(
        "Parameters missing from request",
        HttpStatusCode.BAD_REQUEST
      );
    }

    const { cohort } = req.body;

    if (!cohort.startDate || !cohort.endDate || !cohort.academicYear) {
      throw new SkylabError(
        "Parameters missing from request",
        HttpStatusCode.BAD_REQUEST
      );
    }

    try {
      const createdCohort = await createCohort(cohort);
      return apiResponseWrapper(res, { cohort: createdCohort });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

router
  .put("/:cohortYear", authorizeAdmin, async (req: Request, res: Response) => {
    const { cohortYear } = req.params;

    if (!req.body.cohort) {
      throw new SkylabError(
        "Parameters missing from request body",
        HttpStatusCode.BAD_REQUEST
      );
    }

    try {
      const editedCohort = await editCohortByYear(
        Number(cohortYear),
        req.body.cohort
      );
      return apiResponseWrapper(res, { cohort: editedCohort });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete(
    "/:cohortYear",
    authorizeAdmin,
    async (req: Request, res: Response) => {
      const { cohortYear } = req.params;

      try {
        const deletedCohort = await deleteCohortByYear(Number(cohortYear));
        return apiResponseWrapper(res, { cohort: deletedCohort });
      } catch (e) {
        return routeErrorHandler(res, e);
      }
    }
  );

router
  .get("/current", async (_: Request, res: Response) => {
    try {
      const currentCohort = await getCurrentCohort();
      res.status(HttpStatusCode.OK).json({ cohort: currentCohort });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/latest", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

export default router;
