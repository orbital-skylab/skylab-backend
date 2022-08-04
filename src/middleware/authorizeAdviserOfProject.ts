import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getOneUserById } from "src/helpers/users.helper";
import { findUniqueProject } from "src/models/projects.db";

const authorizeAdviserOfProject = async (
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
    const userData = await getOneUserById(Number(jwtData.id));

    // allow admins
    if (userData.administrator) return next();

    // only allow adviser of project
    if (userData.adviser) {
      const { projectId } = req.params;
      const projectData = await findUniqueProject({
        where: { id: Number(projectId) },
      });
      if (userData.adviser.id === projectData.adviserId) return next();
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

export default authorizeAdviserOfProject;
