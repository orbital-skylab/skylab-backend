import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import apiRouter from "./routes/api";

if (process.env.NODE_ENV === "test") {
  dotenv.config({
    path: "environments/.env.test",
  });
} else if (process.env.NODE_ENV === "production") {
  dotenv.config({
    path: "environments/.env.production",
  });
} else {
  dotenv.config({
    path: "environments/.env.development",
  });
}

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
