/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  deleteOneUser,
  getOneUser,
  updateOneUser,
  getOneUserWithRoleData,
} from "src/models/users.db";
import { TransactionalEmailsApiApiKeys } from "sib-api-v3-typescript";
import { Prisma, PrismaClient } from "@prisma/client";
import { SUBJECT, SENDER, GET_HTML_CONTENT } from "src/utils/Emails";

export enum UserGetFilterRoles {
  Student = "student",
  Administrator = "administrator",
  Mentor = "mentor",
  Adviser = "adviser",
}

export const parseGetUsersFilter = (query: any) => {
  const { cohortYear } = query;

  const filter: Prisma.UserFindManyArgs = {
    take: query.limit && query.page ? query.limit : undefined,
    skip: query.limit && query.page ? query.page * query.limit : undefined,
    where: {
      name: query.search
        ? { contains: query.search, mode: "insensitive" }
        : undefined,
      mentor:
        query.role == UserGetFilterRoles.Mentor
          ? { some: { cohortYear: cohortYear } }
          : undefined,
      student:
        query.role == UserGetFilterRoles.Student
          ? { some: { cohortYear: cohortYear } }
          : undefined,
      adviser:
        query.role == UserGetFilterRoles.Adviser
          ? { some: { cohortYear: cohortYear } }
          : undefined,
      administrator:
        query.role == UserGetFilterRoles.Administrator
          ? { some: { endDate: { gte: new Date() } } }
          : undefined,
    },
  };

  return filter;
};

export const parseFilteredUsers = async (
  user: Prisma.UserGetPayload<{
    include: {
      mentor: true;
      administrator: true;
      adviser: true;
      student: true;
    };
  }>
) => {
  const { student, mentor, administrator, adviser, ...userInfo } = user;
  return {
    ...userInfo,
    student: student[0] ?? {},
    mentor: mentor[0] ?? {},
    adviser: adviser[0] ?? {},
    administrator: administrator[0] ?? {},
  };
};

export const getFilteredUsers = async (query: any) => {
  const filteredQuery = parseGetUsersFilter(query);

  const { cohortYear } = query;
  const prismaClient = new PrismaClient();
  const users: Prisma.UserGetPayload<{
    include: {
      student: true;
      administrator: true;
      adviser: true;
      mentor: true;
    };
  }>[] = await prismaClient.user.findMany({
    ...filteredQuery,
    include: {
      student: { where: { cohortYear: cohortYear } },
      administrator: { where: { endDate: { gte: new Date() } } },
      mentor: { where: { cohortYear: cohortYear } },
      adviser: { where: { cohortYear: cohortYear } },
    },
  });
  return await Promise.all(users.map((user) => parseFilteredUsers(user)));
};

export const userLogin = async (email: string, password: string) => {
  const user = await getOneUser({ where: { email: email } }, true);

  const { password: correctPassword } = user;
  if (!correctPassword) {
    throw new SkylabError(
      "User does not have a password",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const isValidPassword = await bcrypt.compare(password, correctPassword);
  if (!isValidPassword) {
    return {
      token: null,
    };
  }

  const userWithRoleData = await getOneUserWithRoleData({
    where: { id: user.id },
  });
  return {
    token: jwt.sign(userWithRoleData, process.env.JWT_SECRET ?? "jwt_secret"),
  };
};

export const hashPassword = async (plainTextPassword: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(plainTextPassword, saltRounds);
};

export const generateRandomPassword = () => {
  const length = 16;
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$";

  let plainTextPassword = "";
  for (let i = 0; i < length; i++) {
    plainTextPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return plainTextPassword;
};

export const generateRandomHashedPassword = async () => {
  const plainTextPassword = generateRandomPassword();
  return await hashPassword(plainTextPassword);
};

export const sendPasswordResetEmail = async (
  email: string,
  id: number,
  token: string,
  origin: string
) => {
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
};

export const getUserByEmail = async (email: string) => {
  try {
    return await getOneUser({ where: { email: email } });
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    } else {
      throw e;
    }
  }
};

export const editUserInformation = async (
  id: number,
  data: Prisma.UserUpdateInput
) => {
  try {
    return await updateOneUser({ where: { id: id }, data: data });
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    } else {
      throw e;
    }
  }
};

export const deleteUserById = async (id: number) => {
  try {
    return await deleteOneUser({ where: { id: id } });
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    } else {
      throw e;
    }
  }
};
