import { Request, Response, Router } from "express";
import { SkylabError } from "src/errors/SkylabError";
import { createDeadlineHelper } from "src/helpers/deadline.helper";
import { apiResponseWrapper } from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const createdDeadline = await createDeadlineHelper(req.body);
    return apiResponseWrapper(res, createdDeadline);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      return apiResponseWrapper(res, {}, e);
    }
  }
});

export default router;
