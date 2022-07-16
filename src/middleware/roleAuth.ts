import { Request, Response, NextFunction } from "express";
import { getOneUserById } from "src/helpers/users.helper";
import { routeErrorHandler } from "src/utils/ApiResponseWrapper";
import jwt from "jsonwebtoken";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { findUniqueProject } from "src/models/projects.db";

const isAdminOrAdviser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.cookies;
    const jwtData = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "jwt_secret"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const userData = await getOneUserById(Number(jwtData.id));
    if (userData.administrator) next();
    if (userData.adviser) {
      const { projectId } = req.params;
      const projectData = await findUniqueProject({
        where: { id: Number(projectId) },
      });
      if (projectData.adviserId === userData.adviser.id) next();
    }
    throw new SkylabError(
      "You are not authorized to view this page",
      HttpStatusCode.BAD_REQUEST
    );
  } catch (e) {
    routeErrorHandler(res, e);
  }
};

export default isAdminOrAdviser;
