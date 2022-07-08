import { Router, Request, Response } from "express";
import { seedAdmins } from "src/seed/administrator.seed";
import { seedAdvisers } from "src/seed/adviser.seed";
import { seedCohorts } from "src/seed/cohort.seed";
import { seedDeadlines } from "src/seed/deadline.seed";
import { seedMentors } from "src/seed/mentor.seed";
import { seedStudents } from "src/seed/student.seed";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    await seedCohorts();
    await seedStudents();
    await seedMentors();
    await seedAdvisers();
    await seedAdmins();
    await seedDeadlines();
    return apiResponseWrapper(res, { response: "Donezo" });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
