import { Router } from "express";
import healthCheckRouter from "./healthCheck";

// Export the base-router
const baseRouter = Router();

baseRouter.use("/healthCheck", healthCheckRouter);

// Export default.
export default baseRouter;
