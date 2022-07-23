import { Request, Response, Router } from "express";
import { apiResponseWrapper } from "src/utils/ApiResponseWrapper";
import studentDashboardRouter from "./dashboard.student";

const router = Router();

router.use("/student", studentDashboardRouter);

router.get("/", (_: Request, res: Response) => {
  return apiResponseWrapper(res, { message: "Hit" });
});

export default router;
