import { Router } from "express";
import healthCheckRouter from "./healthCheck";
import userRouter from "./users";
import studentRouter from "./students";
import mentorRouter from "./mentors";
import cohortRouter from "./cohorts";
import projectRouter from "./projects";
import adviserRouter from "./advisers";
import facilitatorRouter from "./facilitators";

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

// Export default.
export default baseRouter;
