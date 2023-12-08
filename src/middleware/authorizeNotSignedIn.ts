import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";

const authorizeNotSignedIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req?.cookies?.token;
    if (token && typeof token === "string") {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .send("Authentication failed");
    }
    next();
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
};

export default authorizeNotSignedIn;
