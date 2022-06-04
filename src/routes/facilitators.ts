import { Request, Response, Router } from "express";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.get("/", async (_: Request, res: Response) => {
  try {
    res.status(HttpStatusCode.OK).json([]);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});

export default router;
