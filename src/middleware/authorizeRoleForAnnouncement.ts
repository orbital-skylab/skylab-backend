import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUniqueUserWithRoleData } from "../models/users.db";
import { getOneAnnouncement } from "../models/announcements.db";

const authorizeRoleForAnnouncement = async (
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

    // only allow if accessing data that matches users role
    const { announcementId } = req.params;
    const announcement = await getOneAnnouncement({
      where: {
        id: Number(announcementId),
      },
    });

    switch (announcement.targetAudienceRole) {
      case "Student":
        if (userData.student) return next();
        break;
      case "Adviser":
        if (userData.adviser) return next();
        break;
      case "Mentor":
        if (userData.mentor) return next();
        break;
      case "All":
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

export default authorizeRoleForAnnouncement;
