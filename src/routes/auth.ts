import { Router, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { SkylabError } from "src/errors/SkylabError";
import {
  generateRandomPassword,
  hashPassword,
  userLogin,
} from "src/helpers/users.helper";
import authorize from "src/middleware/jwtAuth";
import {
  getOneUser,
  getOneUserWithRoleData,
  updateOneUser,
} from "src/models/users.db";
import { apiResponseWrapper } from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.post("/sign-in", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return apiResponseWrapper(
        res,
        {},
        new SkylabError(
          "Missing request parameters",
          HttpStatusCode.BAD_REQUEST
        )
      );
    }

    const { token } = await userLogin(email, password);

    if (token) {
      const userData = await getOneUserWithRoleData({
        where: { email: email },
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          maxAge: 10 * 60 * 60 * 24 * 1000,
        })
        .status(HttpStatusCode.OK)
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

router.get("/sign-out", authorize, async (_: Request, res: Response) => {
  try {
    res.clearCookie("token").sendStatus(HttpStatusCode.OK);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});

router.get("/info", authorize, async (req: Request, res: Response) => {
  try {
    const { token } = req.cookies;
    const userData = jwt.verify(token, process.env.JWT_SECRET ?? "jwt_secret");
    res.status(HttpStatusCode.OK).json(userData);
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
    } else {
      res.status(e.statusCode).send(e.message);
    }
  }
});

router.post(
  "/:email/regenerate-password",
  async (req: Request, res: Response) => {
    try {
      const password = generateRandomPassword();
      const hashedPassword = await hashPassword(password);

      const { email } = req.params;
      await updateOneUser({
        where: { email: email },
        data: { password: hashedPassword },
      });

      return res.status(HttpStatusCode.OK).json({ password });
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  }
);

router.post(
  "/reset-password",
  authorize,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.cookies;
      const { id } = jwt.verify(
        token,
        process.env.JWT_SECRET ?? "jwt_secret"
      ) as JwtPayload;
      const { password } = await getOneUser(
        {
          where: { id: id },
          select: {
            password: true,
          },
        },
        true
      );

      const { currentPassword, newPassword } = req.body;
      if (currentPassword !== password) {
        throw new SkylabError(
          "Current password does not match record in database",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const hashedPassword = await hashPassword(newPassword);
      await updateOneUser({
        where: { id: id },
        data: { password: hashedPassword },
      });

      return res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  }
);

export default router;
