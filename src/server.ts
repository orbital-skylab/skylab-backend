import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

import apiRouter from "./routes/api";
import { HttpStatusCode } from "./utils/HTTP_Status_Codes";

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

app.get("/", (_: Request, res: Response) => {
  return res.status(HttpStatusCode.OK).json("Server is running");
});

// Add api router
app.use("/api", apiRouter);

export default app;
