import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  createManyMentorsHelper,
  createMentorHelper,
  getFilteredMentors,
  getMentorByEmail,
} from "src/helpers/mentors.helper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .get("/", async (req: Request, res: Response) => {
    try {
      const allMentors = await getFilteredMentors(req.query);
      res.status(HttpStatusCode.OK).json(allMentors);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  })
  .post("/", async (req: Request, res: Response) => {
    if (!req.body.user || !req.body.user.email) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Arguments missing from request");
    }

    try {
      await createMentorHelper(req.body.user);
      res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  })
  .all("/", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

router.post("/batch", async (req: Request, res: Response) => {
  if (!req.body.users) {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Parameters missing from request");
  }

  try {
    await createManyMentorsHelper(req.body.users);
    res.sendStatus(HttpStatusCode.OK);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.BAD_REQUEST).send(e.message);
    } else {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    }
  }
});

router
  .get("/:email", async (req: Request, res: Response) => {
    const { email } = req.params;
    try {
      const mentorWithEmail = await getMentorByEmail(email);
      res.status(HttpStatusCode.OK).json(mentorWithEmail);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  })
  .all("/:email", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

export default router;
