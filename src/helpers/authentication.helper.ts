import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { TransactionalEmailsApiApiKeys } from "sib-api-v3-typescript";
import { SkylabError } from "../errors/SkylabError";
import { findUniqueUserWithRoleData } from "../models/users.db";
import { SUBJECT, SENDER, GET_HTML_CONTENT } from "../utils/Emails";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { removePasswordFromUser } from "./users.helper";
import { Request, Response } from "express";

const PASSWORD_HASH_SALT_ROUNDS = 10;
const RANDOM_PASSWORD_LENGTH = 16;
const RANDOM_PASSWORD_CHARACTERS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$";

export async function userLogin(email: string, passwordInput: string) {
  const user = await findUniqueUserWithRoleData({ where: { email: email } });

  const { password } = user;
  if (!password) {
    throw new SkylabError(
      "User does not have a password",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  const isValidPassword = await bcrypt.compare(passwordInput, password);
  if (!isValidPassword) {
    return {
      token: null,
    };
  } else {
    const userData = removePasswordFromUser(user);
    return {
      userData,
      token: jwt.sign(userData, process.env.JWT_SECRET ?? "jwt_secret"),
    };
  }
}

export async function hashPassword(plainTextPassword: string) {
  return await bcrypt.hash(plainTextPassword, PASSWORD_HASH_SALT_ROUNDS);
}

export function generateRandomPassword() {
  let plainTextPassword = "";
  for (let i = 0; i < RANDOM_PASSWORD_LENGTH; i++) {
    plainTextPassword += RANDOM_PASSWORD_CHARACTERS.charAt(
      Math.floor(Math.random() * RANDOM_PASSWORD_CHARACTERS.length)
    );
  }
  return hashPassword(plainTextPassword);
}

export async function sendPasswordResetEmail(
  email: string,
  id: number,
  token: string,
  origin: string
) {
  try {
    const sendInBlue = await import("sib-api-v3-typescript");
    const apiInstance = new sendInBlue.TransactionalEmailsApi();
    apiInstance.setApiKey(
      TransactionalEmailsApiApiKeys.apiKey,
      process.env.SIB_EMAIL_API_KEY ?? "sib_email_api_key"
    );
    const newPasswordResetEmail = new sendInBlue.SendSmtpEmail();
    newPasswordResetEmail.subject = SUBJECT;
    newPasswordResetEmail.to = [{ email }];
    newPasswordResetEmail.sender = SENDER;
    newPasswordResetEmail.htmlContent = GET_HTML_CONTENT(origin, token, id);
    await apiInstance.sendTransacEmail(newPasswordResetEmail);
  } catch (e) {
    console.error(e);
  }
}

export function extractJwtData(req: Request, res: Response) {
  const token = req?.cookies?.token;
  if (!token || typeof token !== "string") {
    return res
      .status(HttpStatusCode.UNAUTHORIZED)
      .send("Authentication failed");
  }

  const jwtData = jwt.verify(
    token,
    process.env.JWT_SECRET ?? "jwt_secret"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;

  return jwtData;
}
