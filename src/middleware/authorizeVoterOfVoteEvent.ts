import { NextFunction, Request, Response } from "express";
import { findFirstExternalVoter } from "../models/voteEvent.db";
import { findFirstUser } from "../models/users.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

// Middleware to be used after authorizeVoter middleware
const authorizeVoterOfVoteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!res.locals.userData && !res.locals.voterId) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .send("Authentication failed");
    }

    const voteEventId = Number(req.params.voteEventId);

    if (res.locals.userData) {
      // allow admin to access any vote event
      if (res.locals.userData.administrator.id) {
        return next();
      }

      // check if user is a voter of the vote event
      const userId = res.locals.userData.id;

      await findFirstUser({
        where: { id: userId, voteEvents: { some: { id: voteEventId } } },
      });

      return next();
    }

    if (res.locals.voterId) {
      // check if external voter is a voter of the vote event
      const voterId = res.locals.voterId;

      const externalVoter = await findFirstExternalVoter({
        where: { id: voterId, voteEventId: voteEventId },
      });

      if (!externalVoter) {
        throw new Error();
      }

      return next();
    }
  } catch (e) {
    return res
      .status(HttpStatusCode.UNAUTHORIZED)
      .send("Authentication failed");
  }
};

export default authorizeVoterOfVoteEvent;
