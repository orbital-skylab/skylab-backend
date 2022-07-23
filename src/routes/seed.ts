import { Router, Request, Response } from "express";
import { seedAdmins } from "src/seed/administrator.seed";
import { seedAdvisers } from "src/seed/adviser.seed";
import { seedCohorts } from "src/seed/cohort.seed";
import { seedDeadlines } from "src/seed/deadline.seed";
import { seedMentors } from "src/seed/mentor.seed";
import { seedRelations } from "src/seed/relation.seed";
import { seedAll } from "src/seed/seed.index";
import { seedStudents } from "src/seed/student.seed";
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
router.post("/cohorts", async (_: Request, res: Response) => {
  try {
    await seedCohorts();
    return apiResponseWrapper(res, { response: "Donezo" });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});
router.post("/students", async (_: Request, res: Response) => {
  try {
    await seedStudents();
    return apiResponseWrapper(res, { response: "Donezo" });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});
router.post("/mentors", async (_: Request, res: Response) => {
  try {
    await seedMentors();
    return apiResponseWrapper(res, { response: "Donezo" });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});
router.post("/advisers", async (_: Request, res: Response) => {
  try {
    await seedAdvisers();
    return apiResponseWrapper(res, { response: "Donezo" });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});
router.post("/admins", async (_: Request, res: Response) => {
  try {
    await seedAdmins();
    return apiResponseWrapper(res, { response: "Donezo" });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});
router.post("/deadlines", async (_: Request, res: Response) => {
  try {
    await seedDeadlines();
    return apiResponseWrapper(res, { response: "Donezo" });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});
router.post("/relations", async (_: Request, res: Response) => {
  try {
    await seedRelations();
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

export default router;
