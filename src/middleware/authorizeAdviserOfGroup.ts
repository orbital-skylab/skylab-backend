import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUniqueAdviserWithProjectData } from "../models/advisers.db";
import { findUniqueUserWithRoleData } from "../models/users.db";

const authorizeAdviserOfGroup = async (
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

    // only allow adviser of group
    if (userData.adviser) {
      const { projectIds } = req.body;

      const adviserData = await findUniqueAdviserWithProjectData({
        where: { id: userData.adviser.id },
      });

      const adviserProjects = new Set();
      adviserData.projects
        .map((project) => project.id)
        .forEach((projectId) => adviserProjects.add(projectId));

      const isAdviserOfGroup = (projectIds as number[]).reduce(
        (a, b) => a && adviserProjects.has(b),
        true
      );
      if (isAdviserOfGroup) return next();
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

export default authorizeAdviserOfGroup;
