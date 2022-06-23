import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

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
const allowedOrigins = [
  "https://skylab-frontend.vercel.app",
  "http://localhost:3000",
];
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
/***********************************************************************************
 *                         API routes and error handling
 **********************************************************************************/

app.get("/", (_: Request, res: Response) => {
  return res.status(HttpStatusCode.OK).send("Server is running");
});

// Add api router
app.use("/api", apiRouter);

export default app;
