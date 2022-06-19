import { Prisma } from "@prisma/client";
import {
  deleteOneUser,
  getManyUsers,
  getOneUser,
  getOneUserWithRoleData,
  getUserPassword,
  updateOneUser,
} from "src/models/users.db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import SibApiV3Sdk from "@sendinblue/client";

type Email = {
  email: string;
};

/**
 * @function getAllUsers Get all user records in the database
 * @returns An array of all user records in the database
 */
export const getAllUsers = async () => {
  const allUsers = await getManyUsers({});
  return allUsers;
};

/**
 * @function getUserByEmail Get the user with the specified email
 * @param email The email of the user to retrieve
 * @returns The User Record with the given email
 */
export const getUserByEmail = async (email: string) => {
  const user = await getOneUser({ where: { email: email } });
  return user;
};

/**
 * @function getUserPasswordByEmail Get the user with the specified email
 * @param email The email of the user to retrieve
 * @returns The User Record with the given email
 */
export const getUserPasswordByEmail = async (email: string) => {
  const password = await getUserPassword({ where: { email: email } });
  return password;
};

/**
 * @function getUserWithRoleDataByEmail Get the user with the specified email and role data
 * @param email The email of the user to retrieve
 * @returns The User Record with the given email
 */
export const getUserWithRoleDataByEmail = async (email: string) => {
  const user = await getOneUserWithRoleData({ where: { email: email } });
  return user;
};

/**
 * @function updateUserByEmail Update the user with the specified email
 * @param email The email of the user to update
 * @param updates The updates required for the user record
 */
export const updateUserByEmail = async (
  email: string,
  updates: Prisma.UserUpdateInput
) => {
  return await updateOneUser({ where: { email: email }, data: updates });
};

/**
 * @function deleteUserByEmail Delete the user with the specified email
 * @param email The email of the user to delete
 */
export const deleteUserByEmail = async (email: string) => {
  return await deleteOneUser({ where: { email: email } });
};

export const userLogin = async (email: string, password: string) => {
  const userPassword = await getUserPasswordByEmail(email);
  const validPassword = await bcrypt.compare(password, userPassword);
  return {
    token: validPassword
      ? jwt.sign({ email }, process.env.JWT_SECRET ?? "jwt_secret")
      : null,
  };
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

export const hashPassword = async (plainTextPassword: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(plainTextPassword, saltRounds);
};

export const sendPasswordResetEmail = async (emails: Array<Email>) => {
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
