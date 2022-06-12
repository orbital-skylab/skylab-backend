import jwt from "jsonwebtoken";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";

const authorize = async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.headers;
  if (!token || typeof token !== "string") {
    return res.status(HttpStatusCode.UNAUTHORIZED).send("Not Authenticated");
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET ?? "jwt_secret");
    if (req?.body?.user !== user) {
      throw new SkylabError("User does not match", HttpStatusCode.UNAUTHORIZED);
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

export default authorize;
