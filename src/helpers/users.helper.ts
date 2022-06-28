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
  getManyUsers,
} from "src/models/users.db";
import { TransactionalEmailsApiApiKeys } from "sib-api-v3-typescript";
import { TEMPLATE_ID } from "src/utils/Emails";
import { Prisma } from "@prisma/client";

enum UserFilterRoles {
  Mentor = "Mentor",
  Student = "Student",
  Adviser = "Adviser",
  Admin = "Administrator",
}

export const getUsersFilterParser = (query: any) => {
  let filter: Prisma.UserFindManyArgs = {};

  if (!query.cohortYear) {
    throw new SkylabError(
      "Parameters missing in request",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const cohortYear = Number(query.cohortYear);

  if (query.page && query.limit) {
    filter = {
      take: Number(query.limit),
      skip: Number(query.page) * Number(query.limit),
    };
  }

  filter = {
    ...filter,
    include: {
      student: true,
      administrator: true,
      mentor: true,
      adviser: true,
    },
  };

  if (query.role) {
    switch (query.role) {
      case UserFilterRoles.Mentor:
        filter = {
          ...filter,
          where: { mentor: { some: { cohortYear: cohortYear } } },
        };
        break;
      case UserFilterRoles.Adviser:
        filter = {
          ...filter,
          where: { adviser: { some: { cohortYear: cohortYear } } },
        };
        break;
      case UserFilterRoles.Student:
        filter = {
          ...filter,
          where: { student: { some: { cohortYear: cohortYear } } },
        };
        break;
      case UserFilterRoles.Admin:
        filter = {
          ...filter,
          where: {
            administrator: { some: { endDate: { gte: new Date() } } },
          },
        };
        break;
      default:
        throw new SkylabError(
          "Invalid Input for Role in Request",
          HttpStatusCode.BAD_REQUEST
        );
    }
  }

  return filter;
};

export const getFilteredUsers = async (query: any) => {
  const filteredQuery = getUsersFilterParser(query);
  const users = await getManyUsers(filteredQuery);
  return users;
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

export const sendPasswordResetEmail = async (emails: string[]) => {
  try {
    const sendInBlue = await import("sib-api-v3-typescript");
    const apiInstance = new sendInBlue.TransactionalEmailsApi();
    apiInstance.setApiKey(
      TransactionalEmailsApiApiKeys.apiKey,
      process.env.SIB_EMAIL_API_KEY ?? "sib_email_api_key"
    );
    const newPasswordResetEmail = new sendInBlue.SendEmail();
    newPasswordResetEmail.emailTo = emails;

    await apiInstance.sendTemplate(TEMPLATE_ID, newPasswordResetEmail);
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
