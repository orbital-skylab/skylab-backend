import express from "express";

import apiRouter from "./routes/api";

// Constants
const app = express();

/***********************************************************************************
 *                                  Middlewares
 **********************************************************************************/

// Common middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/***********************************************************************************
 *                         API routes and error handling
 **********************************************************************************/

// Add api router
app.use("/api", apiRouter);

export default app;
