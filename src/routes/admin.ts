import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import { createStudentHelper } from "src/helpers/students.helper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.post("/create-student", async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    // admin should create a user with password
    if (!user || !user.password) {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    const createdStudent = await createStudentHelper(user);
    res.status(HttpStatusCode.OK).json(createdStudent);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});

router.post("/create-student/batch", async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    // admin should create a user with password
    if (!user || !user.password) {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    const createdStudent = await createStudentHelper(user);
    res.status(HttpStatusCode.OK).json(createdStudent);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});
