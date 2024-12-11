import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { EXTERNAL_VOTER_TOKEN } from "../helpers/authentication.helper";
import { SkylabError } from "../errors/SkylabError";
import { findUniqueUserWithRoleData } from "../models/users.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

const authorizeVoter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req?.cookies?.token;

    if (token) {
      const jwtData = jwt.verify(
        token,
        process.env.JWT_SECRET ?? "jwt_secret"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
      const userData = await findUniqueUserWithRoleData({
        where: { id: Number(jwtData.id) },
      });

      res.locals.userData = userData;

      return next();
    }

    const externalVoterToken = req?.cookies?.[EXTERNAL_VOTER_TOKEN];

    if (externalVoterToken) {
      const jwtData = jwt.verify(
        externalVoterToken,
        process.env.JWT_SECRET ?? "jwt_secret"
      ) as { voterId: string };
      res.locals.voterId = jwtData.voterId;

      return next();
    }

    return res
      .status(HttpStatusCode.UNAUTHORIZED)
      .send("Authentication failed");
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
};

export default authorizeVoter;
