import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import { userLogin } from "src/helpers/users.helper";
import authorize from "src/middleware/jwtAuth";
import { getOneUserWithRoleData } from "src/models/users.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.post("/sign-in", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(HttpStatusCode.BAD_REQUEST).send("Missing request parameters");
    }

    const { token } = await userLogin(email, password);
    if (token) {
      const userData = await getOneUserWithRoleData(email);
      res
        .status(HttpStatusCode.OK)
        .cookie("jwt", token, { httpOnly: true })
        .json(userData);
    } else {
      res.status(HttpStatusCode.UNAUTHORIZED).send("Password is incorrect");
    }
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});

router.post(
  "/:userId/sign-out",
  authorize,
  async (_: Request, res: Response) => {
    try {
      res.status(HttpStatusCode.OK).clearCookie("jwt");
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  }
);
