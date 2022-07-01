import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { TransactionalEmailsApiApiKeys } from "sib-api-v3-typescript";
import { SkylabError } from "src/errors/SkylabError";
import { findUniqueUserWithRoleData } from "src/models/users.db";
import { SUBJECT, SENDER, GET_HTML_CONTENT } from "src/utils/Emails";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { removePasswordFromUser } from "./users.helper";

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
    const userWithoutPassword = removePasswordFromUser(user);
    return {
      token: jwt.sign(
        userWithoutPassword,
        process.env.JWT_SECRET ?? "jwt_secret"
      ),
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
