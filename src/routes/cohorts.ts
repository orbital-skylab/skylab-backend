import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import { getCurrentCohort, createCohort } from "src/models/cohorts.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  if (!req.body.cohort) {
    return res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Parameters missing from request");
  }

  const { cohort } = req.body;

  try {
    await createCohort(cohort);
    return res.sendStatus(HttpStatusCode.OK);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});

router
  .get("/latest", async (_: Request, res: Response) => {
    try {
      const latestCohort = await getCurrentCohort();
      res.status(HttpStatusCode.OK).json(latestCohort);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  })
  .all("/latest", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

export default router;
