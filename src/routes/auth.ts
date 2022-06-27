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
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router.post("/sign-in", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new SkylabError(
        "Missing request parameters",
        HttpStatusCode.BAD_REQUEST
      );
    }

    const { token } = await userLogin(email, password);

    if (!token) {
      throw new SkylabError(
        "Password is incorrect",
        HttpStatusCode.UNAUTHORIZED
      );
    }

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
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/sign-out", authorize, async (_: Request, res: Response) => {
  try {
    res.clearCookie("token").sendStatus(HttpStatusCode.OK);
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/info", authorize, async (req: Request, res: Response) => {
  try {
    const { token } = req.cookies;
    const userData = jwt.verify(token, process.env.JWT_SECRET ?? "jwt_secret");
    return apiResponseWrapper(res, userData as JwtPayload);
  } catch (e) {
    return routeErrorHandler(res, e);
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

      return apiResponseWrapper(res, { password });
    } catch (e) {
      return routeErrorHandler(res, e);
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

      return apiResponseWrapper(res, {});
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  }
);

export default router;
