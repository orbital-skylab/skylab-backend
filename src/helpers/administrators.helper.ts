/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, User } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import {
  createOneAdministrator,
  deleteUniqueAdministrator,
  findManyAdministratorsWithUserData,
  findUniqueAdministratorWithUserData,
  updateUniqueAdministrator,
} from "../models/administrators.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { hashPassword, generateRandomPassword } from "./authentication.helper";
import { isValidEmail, removePasswordFromUser } from "./users.helper";
import { prismaMinimal as prisma } from "../client";

export async function parseGetAdministratorInput(
  administrator: Prisma.AdministratorGetPayload<{ include: { user: true } }>
) {
  const { user, id, ...data } = administrator;
  const userWithoutPassword = removePasswordFromUser(user);
  return { ...userWithoutPassword, ...data, administratorId: id };
}

export async function getManyAdministratorsWithFilter(
  query: any & { limit?: number; page?: number }
) {
  const { limit, page } = query;

  /* Create Filter Object */
  const adminQuery: Prisma.AdministratorFindManyArgs = {
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
  };

  const admins = await findManyAdministratorsWithUserData(adminQuery);

  const parsedAdmins = admins.map((admin) => parseGetAdministratorInput(admin));
  return parsedAdmins;
}

export async function getOneAdministratorById(administratorId: string) {
  const administrator = await findUniqueAdministratorWithUserData({
    where: { id: Number(administratorId) },
  });
  return parseGetAdministratorInput(administrator);
}

export async function createUserWithAdministratorRole(
  body: any,
  isDev?: boolean
) {
  const { administrator, user } = body;
  if (isDev && !user.password) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password =
    isDev && user.password
      ? await hashPassword(user.password)
      : await generateRandomPassword();

  const [createdUser, createdAdministrator] = await prisma.$transaction([
    prisma.user.create({ data: user }),
    prisma.administrator.create({
      data: {
        ...administrator,
        user: { connect: { email: user.email } },
      },
    }),
  ]);

  return {
    user: removePasswordFromUser(createdUser),
    administrator: createdAdministrator,
  };
}

export async function createManyUsersWithAdministratorRole(
  body: any,
  isDev?: boolean
) {
  const { count, accounts } = body;

  if (count !== accounts.length) {
    throw new SkylabError(
      "Count and Accounts Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const accountsWithHashedPasswords = await Promise.all(
    (
      accounts as {
        user: User;
        administrator: Prisma.AdministratorCreateInput;
      }[]
    ).map(async (account) => {
      const { user, administrator } = account;
      return {
        user: {
          ...user,
          password:
            isDev && user.password
              ? await hashPassword(user.password)
              : await generateRandomPassword(),
        },
        administrator,
      };
    })
  );

  const createAccountAttempts = await Promise.allSettled(
    accountsWithHashedPasswords.map(async (account) => {
      const { user, administrator } = account;
      if (!isValidEmail(user.email)) {
        throw new SkylabError("Email is invalid", HttpStatusCode.BAD_REQUEST);
      }

      const [createdUser, createdAdministrator] = await prisma.$transaction([
        prisma.user.create({ data: user }),
        prisma.administrator.create({
          data: {
            ...administrator,
            user: { connect: { email: user.email } },
          },
        }),
      ]);
      return {
        user: removePasswordFromUser(createdUser),
        administrator: createdAdministrator,
      };
    })
  );

  return createAccountAttempts
    .map((attempt, index) => {
      if (attempt.status === "rejected") {
        return `- Row ${index + 1}: ${attempt.reason.message}`;
      }
    })
    .filter((error) => error)
    .join("\n");
}

export async function addAdministratorRoleToUser(userId: string, body: any) {
  const { administrator } = body;
  return await createOneAdministrator({
    data: {
      ...administrator,
      user: { connect: { id: Number(userId) } },
    },
  });
}

export async function updateAdministratorDataByAdminID(
  adminId: number,
  body: any
) {
  const { administrator } = body;
  return await updateUniqueAdministrator({
    where: { id: adminId },
    data: administrator,
  });
}

export async function deleteOneAdministratorByAdminId(adminId: number) {
  const deletedAdministrator = await deleteUniqueAdministrator({
    where: { id: adminId },
  });
  return deletedAdministrator;
}
