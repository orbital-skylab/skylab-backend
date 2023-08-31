import { Router } from "express";
import healthCheckRouter from "./healthCheck";
import userRouter from "./users";
import studentRouter from "./students";
import mentorRouter from "./mentors";
import cohortRouter from "./cohorts";
import projectRouter from "./projects";
import adviserRouter from "./advisers";
import devRouter from "./dev";
import deadlineRouter from "./deadlines";
import authRouter from "./auth";
import administratorRouter from "./administrators";
import relationRouter from "./relations";
import dashboardRouter from "./dashboard";
import submissionRouter from "./submissions";
import announcementsRouter from "./announcements";

// Export the base-router
const baseRouter = Router();

baseRouter.use("/healthCheck", healthCheckRouter);
baseRouter.use("/users", userRouter);
baseRouter.use("/students", studentRouter);
baseRouter.use("/mentors", mentorRouter);
baseRouter.use("/cohorts", cohortRouter);
baseRouter.use("/projects", projectRouter);
baseRouter.use("/advisers", adviserRouter);
baseRouter.use("/dev", devRouter);
baseRouter.use("/deadlines", deadlineRouter);
baseRouter.use("/auth", authRouter);
baseRouter.use("/administrators", administratorRouter);
baseRouter.use("/relations", relationRouter);
baseRouter.use("/dashboard", dashboardRouter);
baseRouter.use("/submissions", submissionRouter);
baseRouter.use("/announcements", announcementsRouter);

// Export default.
export default baseRouter;
