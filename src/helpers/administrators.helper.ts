/* eslint-disable @typescript-eslint/no-explicit-any */
import { Administrator, Prisma, PrismaClient, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneAdministrator,
  findManyAdministratorsWithUserData,
  findUniqueAdministratorWithUserData,
} from "src/models/administrators.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { hashPassword, generateRandomPassword } from "./authentication.helper";
import { removePasswordFromUser } from "./users.helper";

const prismaClient = new PrismaClient();

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

  const [createdUser, createdAdministrator] = await prismaClient.$transaction([
    prismaClient.user.create({ data: user }),
    prismaClient.administrator.create({
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

  accounts.map(
    async (account: {
      user: User;
      administrator: Administrator;
    }): Promise<{
      user: User;
      administrator: Administrator;
    }> => {
      if (isDev && !account.user.password) {
        throw new SkylabError(
          "All accounts should have a password input",
          HttpStatusCode.BAD_REQUEST
        );
      }
      const { user, administrator } = account;
      const password =
        isDev && user.password
          ? await hashPassword(user.password)
          : await generateRandomPassword();
      return {
        user: {
          ...user,
          password,
        },
        administrator,
      };
    }
  );
  await Promise.all(accounts);

  const createdAccounts = [];
  for (const account of accounts) {
    const { user, administrator } = account;
    const [createdUser, createdAdministrator] = await prismaClient.$transaction(
      [
        prismaClient.user.create({ data: user }),
        prismaClient.administrator.create({
          data: {
            ...administrator,
            user: { connect: { email: user.email } },
          },
        }),
      ]
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    createdAccounts.push({
      user: removePasswordFromUser(createdUser),
      administrator: createdAdministrator,
    });
  }

  return createdAccounts;
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
