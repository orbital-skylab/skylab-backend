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
    const { id } = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "jwt_secret"
    ) as JwtPayload;
    const userId = req?.params?.userId;
    if (!userId) {
      throw new SkylabError("Missing User Id", HttpStatusCode.BAD_REQUEST);
    }
    if (Number(userId) !== id) {
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
