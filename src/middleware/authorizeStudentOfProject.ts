import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUniqueProjectWithUserData } from "../models/projects.db";
import { findUniqueUserWithRoleData } from "../models/users.db";

const authorizeStudentOfProject = async (
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

    // only allow student of project
    if (userData.student) {
      const { projectId } = req.params;
      const projectData = await findUniqueProjectWithUserData({
        where: { id: Number(projectId) },
      });
      if (
        projectData.students
          .map((student) => student.userId)
          .includes(userData.id)
      )
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

export default authorizeStudentOfProject;
