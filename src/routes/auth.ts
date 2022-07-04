import { Router, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { SkylabError } from "src/errors/SkylabError";
import {
  hashPassword,
  sendPasswordResetEmail,
  userLogin,
} from "src/helpers/authentication.helper";
import authorize from "src/middleware/jwtAuth";
import {
  findUniqueUser,
  findUniqueUserWithRoleData,
  updateUniqueUser,
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

    const userData = await findUniqueUserWithRoleData({
      where: { email: email },
    });
    return res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: 10 * 60 * 60 * 24 * 1000,
        sameSite: "none",
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

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, origin } = req.body;
    const { id, password } = await findUniqueUser({
      where: { email: email },
      select: {
        password: true,
        id: true,
      },
    });

    if (!password) {
      throw new SkylabError("User not found", HttpStatusCode.BAD_REQUEST);
    }

    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 30);
    console.log(expiryDate.toString());
    const token = jwt.sign({ id, expiryDate }, password);

    sendPasswordResetEmail(email, id, token, origin);

    return apiResponseWrapper(res, {});
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.post("/change-password", async (req: Request, res: Response) => {
  try {
    const { id, token, newPassword } = req.body;

    const { password } = await findUniqueUser({
      where: { id: id },
      select: {
        password: true,
      },
    });

    if (!password) {
      throw new SkylabError("User not found", HttpStatusCode.BAD_REQUEST);
    }

    const { id: userId, expiryDate } = jwt.verify(
      token,
      password
    ) as JwtPayload;

    if (Number(id) !== Number(userId)) {
      throw new SkylabError(
        "User id does not match",
        HttpStatusCode.BAD_REQUEST
      );
    }

    if (new Date() > expiryDate) {
      throw new SkylabError(
        "Reset password link has expired",
        HttpStatusCode.BAD_REQUEST
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUniqueUser({
      where: { id: id },
      data: { password: hashedPassword },
    });

    return apiResponseWrapper(res, {});
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
