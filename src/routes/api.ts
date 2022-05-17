import { Router } from "express";
import healthCheckRouter from "./healthCheck";
import userRouter from "./users";

// Export the base-router
const baseRouter = Router();

baseRouter.use("/healthCheck", healthCheckRouter);
baseRouter.use("/users", userRouter);

// Export default.
export default baseRouter;
