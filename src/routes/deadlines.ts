import { Request, Response, Router } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  createDeadlineHelper,
  getFilteredDeadlines,
} from "src/helpers/deadline.helper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .get("/", async (req: Request, res: Response) => {
    try {
      const deadlines = await getFilteredDeadlines(req.query);
      res.status(HttpStatusCode.OK).json(deadlines);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  })
  .post("/", async (req: Request, res: Response) => {
    try {
      if (!req.body.deadline) {
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .send("Arguments missing from request");
      }

      const { deadline } = req.body;
      if (
        !deadline.cohortYear ||
        !deadline.name ||
        !deadline.dueBy ||
        !deadline.type
      ) {
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .send("Error due to incomplete deadline parameters");
      }

      await createDeadlineHelper(req.body);
      res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  });

export default router;
