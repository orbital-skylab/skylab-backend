import { Router } from "express";
import studentDashboardRouter from "./dashboard.student";

const router = Router();

router.use("/student", studentDashboardRouter);

export default router;
