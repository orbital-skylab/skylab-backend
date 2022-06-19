import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import SibApiV3Sdk from "@sendinblue/client";
import { getOneUser } from "src/models/users.db";

export const userLogin = async (email: string, password: string) => {
  const user = await getOneUser({ where: { email: email } });
  const isValidPassword = await bcrypt.compare(password, user.password);
  return {
    token: isValidPassword
      ? jwt.sign(user, process.env.JWT_SECRET ?? "jwt_secret")
      : null,
  };
};

export const hashPassword = async (plainTextPassword: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(plainTextPassword, saltRounds);
};

export const generateRandomHashedPassword = async () => {
  const length = 16;
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$";

  let plainTextPassword = "";
  for (let i = 0; i < length; i++) {
    plainTextPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return await hashPassword(plainTextPassword);
};

export const sendPasswordResetEmail = async (
  emails: Array<{ email: string }>
) => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  apiInstance.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    process.env.SIB_EMAIL_API_KEY ?? "sib_email_api_key"
  );

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Reset Password for Orbital Skylab";
  sendSmtpEmail.sender = { email: "nvjn37@gmail.com" };
  sendSmtpEmail.to = emails;
  sendSmtpEmail.bcc = [{ email: "nvjn37@gmail.com" }];
  sendSmtpEmail.replyTo = { email: "nvjn37@gmail.com" };

  apiInstance.sendTransacEmail(sendSmtpEmail).then(
    function (data) {
      console.log(
        "API called successfully. Returned data: " + JSON.stringify(data)
      );
    },
    function (error) {
      console.error(error);
    }
  );
};
