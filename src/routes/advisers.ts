import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  getAdviserByEmailParsed,
  getAllAdvisersParsed,
} from "src/helpers/advisers.helper";
import {
  createAdviserUser,
  createManyAdviserUsers,
} from "src/models/advisers.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .get("/", async (_: Request, res: Response) => {
    try {
      const allAdvisers = await getAllAdvisersParsed();
      res.status(HttpStatusCode.OK).json(allAdvisers);
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

    const userToCreate = req.body.user;

    try {
      await createAdviserUser(userToCreate);
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

router
  .post("/batch", async (req: Request, res: Response) => {
    if (!req.body.users) {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    const { users } = req.body;

    try {
      await createManyAdviserUsers(users);
      res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.BAD_REQUEST).send(e.message);
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      }
    }
  })
  .all("/batch", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

router
  .get("/:email", async (req: Request, res: Response) => {
    const { email } = req.params;
    try {
      const adviserWithEmail = await getAdviserByEmailParsed(email);
      res.status(HttpStatusCode.OK).json(adviserWithEmail);
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

router
  .post("/batch", async (req: Request, res: Response) => {
    if (!req.body.users) {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    const { users } = req.body;

    try {
      await createManyAdviserUsers(users);
      res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.BAD_REQUEST).send(e.message);
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      }
    }
  })
  .all("/batch", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

export default router;
