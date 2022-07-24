import { Request, Response, Router } from "express";
import { apiResponseWrapper } from "src/utils/ApiResponseWrapper";
import studentDashboardRouter from "./dashboard.student";
import adviserDashboardRouter from "./dashboard.adviser";
import mentorDashboardRouter from "./dashboard.mentor";

const router = Router();

router.use("/student", studentDashboardRouter);
router.use("/adviser", adviserDashboardRouter);
router.use("/mentor", mentorDashboardRouter);

router.get("/", (_: Request, res: Response) => {
  return apiResponseWrapper(res, { message: "Hit" });
});

export default router;
