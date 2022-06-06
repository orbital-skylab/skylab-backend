import { Request, Response, Router } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  createManyFacilitatorsHelper,
  getFacilitatorByEmail,
  getFilteredFacilitators,
} from "src/helpers/facilitator.helper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .get("/", async (req: Request, res: Response) => {
    try {
      const allFacilitators = await getFilteredFacilitators(req.query);
      res.status(HttpStatusCode.OK).json(allFacilitators);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  })
  .post("/", async (req: Request, res: Response) => {
    if (!req.body.user || !req.body.user.email || !req.body.user.cohortYear) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Arguments missing from request");
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

    try {
      await createManyFacilitatorsHelper(req.body.users);
      res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.BAD_REQUEST).send(e.message);
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      }
    }
  })
  .all("/", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

router
  .get("/:email", async (req: Request, res: Response) => {
    const { email } = req.params;
    try {
      const facilitatorWithEmail = await getFacilitatorByEmail(email);
      return facilitatorWithEmail;
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
