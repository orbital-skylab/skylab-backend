import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUniqueRelationWithFromProjectData } from "../models/relations.db";
import { findUniqueUserWithRoleData } from "../models/users.db";

const authorizeAdviserOfRelation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req?.cookies?.token;
    if (!token || typeof token !== "string") {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .send("Authentication failed");
    }

    const jwtData = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "jwt_secret"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const userData = await findUniqueUserWithRoleData({
      where: { id: Number(jwtData.id) },
    });
    // allow admins
    if (userData.administrator) return next();

    // only allow adviser of relation
    if (userData.adviser) {
      const { relationId } = req.params;
      const relationData = await findUniqueRelationWithFromProjectData({
        where: { id: Number(relationId) },
      });
      if (userData.adviser.id === relationData?.fromProject.adviserId)
        return next();
    }

    return res
      .status(HttpStatusCode.UNAUTHORIZED)
      .send("You are not authorized to view this page");
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
};

export default authorizeAdviserOfRelation;
