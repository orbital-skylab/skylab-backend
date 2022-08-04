import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUniqueSubmission } from "src/models/submissions.db";
import { findUniqueProjectWithUserData } from "src/models/projects.db";
import { findUniqueUserWithRoleData } from "src/models/users.db";

const authorizeSubmitter = async (
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

    // only allow if accessing self submission
    const { submissionId } = req.params;
    const submissionData = await findUniqueSubmission({
      where: { id: Number(submissionId) },
    });
    if (submissionData?.fromUserId === userData.id) return next();

    // only allow if one of the students of the project submission
    if (submissionData?.fromProjectId) {
      const projectData = await findUniqueProjectWithUserData({
        where: { id: submissionData.fromProjectId },
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

export default authorizeSubmitter;
