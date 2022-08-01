import { Router } from "express";
import studentDashboardRouter from "./dashboard.student";
import adviserDashboardRouter from "./dashboard.adviser";
import mentorDashboardRouter from "./dashboard.mentor";
import adminDashboardRouter from "./dashboard.admin";

const router = Router();

router.use("/student", studentDashboardRouter);
router.use("/adviser", adviserDashboardRouter);
router.use("/mentor", mentorDashboardRouter);
router.use("/administrator", adminDashboardRouter);

export default router;
