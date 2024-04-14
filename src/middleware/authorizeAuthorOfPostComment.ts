import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getOneForumComment } from "../models/forumposts.db";

const authorizeAuthorOfPostComment = async (
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

    const userId = jwtData.id;

    const { commentId } = req.params;
    const comment = await getOneForumComment({
      where: {
        id: Number(commentId),
      },
    });

    // only allow if user is author of comment
    if (comment && comment.userId === userId) return next();

    return res
      .status(HttpStatusCode.UNAUTHORIZED)
      .send("You are not authorized to perform this action");
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
};

export default authorizeAuthorOfPostComment;
