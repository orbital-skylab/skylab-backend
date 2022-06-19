import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  getUserWithRoleDataByEmail,
  userLogin,
} from "src/helpers/users.helper";
import authorize from "src/middleware/jwtAuth";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.post("/sign-in", async (req: Request, res: Response) => {
  try {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res
          .status(HttpStatusCode.BAD_REQUEST)
          .send("Missing request parameters");
      }

      const { token } = await userLogin(email, password);
      if (token) {
        const userData = await getUserWithRoleDataByEmail(email);
        res
          .status(HttpStatusCode.OK)
          .cookie("token", token, { httpOnly: true })
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
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});

router.post("/sign-out", authorize, async (req: Request, res: Response) => {
  try {
    try {
      const { email } = req.body;

      if (!email) {
        res
          .status(HttpStatusCode.BAD_REQUEST)
          .send("Missing request parameters");
      }

      res.status(HttpStatusCode.OK).clearCookie("token");
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});
