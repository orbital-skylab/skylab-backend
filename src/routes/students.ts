import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  createManyStudentUsers,
  createStudentUser,
  getAllStudents,
  getStudentByEmail,
} from "src/models/students.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .get("/", async (_: Request, res: Response) => {
    try {
      const allStudents = await getAllStudents();
      res.status(HttpStatusCode.OK).json(allStudents);
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
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Arguments missing from request");
    }

    const userToCreate = req.body.user;

    try {
      await createStudentUser(userToCreate);
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

router.get("/:email", async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const studentWithEmail = await getStudentByEmail(email);
    res.status(HttpStatusCode.OK).json(studentWithEmail);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
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
      await createManyStudentUsers(users);
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
