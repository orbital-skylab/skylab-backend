/* eslint-disable @typescript-eslint/no-explicit-any */
import { Administrator, Prisma, PrismaClient, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneAdministrator,
  getManyAdministrators,
  getOneAdministrator,
} from "src/models/administrators.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  hashPassword,
  generateRandomHashedPassword,
  sendPasswordResetEmail,
} from "./users.helper";

const prismaClient = new PrismaClient();

/**
 * @function getAdministratorInputParser Parse the input returned from the prisma.administrator.find function
 * @param administrator The payload returned from prisma.administrator.find
 * @returns Flattened object with both User and Administrator Data
 */
export const getAdministratorInputParser = (
  administrator: Prisma.AdministratorGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = administrator;
  return { ...user, ...data, administratorId: id };
};

export const getAdministratorById = async (administratorId: string) => {
  const administrator = await getOneAdministrator({
    where: { id: Number(administratorId) },
  });
  return getAdministratorInputParser(administrator);
};

/**
 * @function getAdministratorsFilterParser Parse the query from the HTTP Request and returns a query object
 * for prisma.administrator.findMany
 * @param query The raw query object from the HTTP Request
 * @returns A filter object that works with prisma.administrator.findMany
 */
export const getAdministratorsFilterParser = (query: any) => {
  let filter: Prisma.AdministratorFindManyArgs = {};

  if ((query.page && !query.limit) || (query.limit && !query.page)) {
    throw new SkylabError(
      `${
        query.limit ? "Page" : "Limit"
      } parameter missing in a pagination query`,
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (query.page && query.limit) {
    filter = {
      ...filter,
      take: Number(query.limit),
      skip: Number(query.page) * Number(query.limit),
    };
  }

  return filter;
};

/**
 * @function getFilteredAdministrators Retrieve a list of administrators that match the given query parameters
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Administrator Records that match the given query
 */
export const getFilteredAdministrators = async (query: any) => {
  const filteredQuery = getAdministratorsFilterParser(query);
  const administrators = await getManyAdministrators(filteredQuery);
  const parsedAdministrators = administrators.map(
    (
      administrator: Prisma.AdministratorGetPayload<{ include: { user: true } }>
    ) => getAdministratorInputParser(administrator)
  );
  return parsedAdministrators;
};

export const createNewAdministratorParser = async (
  body: any,
  isDev: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  administrator: Prisma.AdministratorCreateInput;
}> => {
  const { administrator, user } = body;
  if (!administrator || !user || (isDev && !user.password)) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password =
    isDev && user.password
      ? await hashPassword(user.password)
      : await generateRandomHashedPassword();

  return { administrator, user };
};

export const createNewAdministrator = async (body: any, isDev?: boolean) => {
  const account = await createNewAdministratorParser(body, isDev ?? false);

  const { user, administrator } = account;

  const [createdUser, createdAdministrator] = await prismaClient.$transaction([
    prismaClient.user.create({ data: user }),
    prismaClient.administrator.create({
      data: {
        ...administrator,
        user: { connect: { email: user.email } },
      },
    }),
  ]);

  if (!isDev) {
    await sendPasswordResetEmail([createdUser.email]);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...createdUserWithoutPassword } = createdUser;
  return {
    user: createdUserWithoutPassword,
    administrator: createdAdministrator,
  };
};

export const createManyAdministratorsParser = async (
  body: any,
  isDev: boolean
): Promise<
  {
    user: Prisma.UserCreateInput;
    administrator: Prisma.AdministratorCreateInput;
  }[]
> => {
  const { count, accounts } = body;

  if (!count || !accounts) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }
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
          : await generateRandomHashedPassword();
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

  return accounts;
};

export const createManyAdministrators = async (body: any, isDev?: boolean) => {
  const accounts = await createManyAdministratorsParser(body, isDev ?? false);
  const createdAccounts: Array<{
    user: Omit<User, "password">;
    administrator: Administrator;
  }> = [];
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
    const { password, ...createdUserWithoutPassword } = createdUser;
    createdAccounts.push({
      user: createdUserWithoutPassword,
      administrator: createdAdministrator,
    });
  }

  if (!isDev) {
    const mailingList = createdAccounts.map((account) => account.user.email);
    await sendPasswordResetEmail(mailingList);
  }
  return createdAccounts;
};

export const addAdministratorToAccountParser = (
  body: any
): Prisma.AdministratorCreateInput => {
  if (!body.administrator) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  return body.administrator;
};

export const addAdministratorToAccount = async (userId: string, body: any) => {
  const administrator = addAdministratorToAccountParser(body);
  return await createOneAdministrator({
    data: {
      ...administrator,
      user: { connect: { id: Number(userId) } },
    },
  });
};
