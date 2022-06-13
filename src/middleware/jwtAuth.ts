import jwt, { JwtPayload } from "jsonwebtoken";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";

const authorize = async (req: Request, res: Response, next: NextFunction) => {
  const token = req?.cookies?.token;
  if (!token || typeof token !== "string") {
    return res
      .status(HttpStatusCode.UNAUTHORIZED)
      .send("Authentication failed");
  }

  try {
    const { email } = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "jwt_secret"
    ) as JwtPayload;
    if (req?.params?.email !== email) {
      throw new SkylabError("Verification failed", HttpStatusCode.UNAUTHORIZED);
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
