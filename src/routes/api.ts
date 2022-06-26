import { Router } from "express";
import healthCheckRouter from "./healthCheck";
import userRouter from "./users";
import studentRouter from "./students";
import mentorRouter from "./mentors";
import cohortRouter from "./cohorts";
import projectRouter from "./projects";
import adviserRouter from "./advisers";
import facilitatorRouter from "./facilitators";
import devRouter from "./dev";
import deadlineRouter from "./deadlines";
import authRouter from "./auth";

// Export the base-router
const baseRouter = Router();

baseRouter.use("/healthCheck", healthCheckRouter);
baseRouter.use("/users", userRouter);
baseRouter.use("/students", studentRouter);
baseRouter.use("/mentors", mentorRouter);
baseRouter.use("/cohorts", cohortRouter);
baseRouter.use("/projects", projectRouter);
baseRouter.use("/advisers", adviserRouter);
baseRouter.use("/facilitators", facilitatorRouter);
baseRouter.use("/admin", devRouter);
baseRouter.use("/deadlines", deadlineRouter);
baseRouter.use("/auth", authRouter);

// Export default.
export default baseRouter;
