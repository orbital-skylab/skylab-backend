import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import apiRouter from "./routes/api";

dotenv.config({
  path: "../.env",
});

// Constants
const app = express();

app.disable("x-powered-by");

/***********************************************************************************
 *                                  Middlewares
 **********************************************************************************/

// Common middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/***********************************************************************************
 *                         API routes and error handling
 **********************************************************************************/

// Add api router
app.use("/api", apiRouter);

export default app;
