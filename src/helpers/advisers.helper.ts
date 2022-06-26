/* eslint-disable @typescript-eslint/no-explicit-any */
import { Adviser, Prisma, PrismaClient, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneAdviser,
  getManyAdvisers,
  getOneAdviser,
} from "src/models/advisers.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  hashPassword,
  generateRandomHashedPassword,
  sendPasswordResetEmail,
} from "./users.helper";

const prismaClient = new PrismaClient();

/**
 * @function getAdviserInputParser Parse the input returned from the prisma.adviser.find function
 * @param adviser The payload returned from prisma.adviser.find
 * @returns Flattened object with both User and Adviser Data
 */
export const getAdviserInputParser = (
  adviser: Prisma.AdviserGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = adviser;
  return { ...user, ...data, adviserId: id };
};

export const getAdviserById = async (adviserId: string) => {
  const adviser = await getOneAdviser({ where: { id: Number(adviserId) } });
  return getAdviserInputParser(adviser);
};

/**
 * @function getFilteredAdvisersWhereInputParser Parse the query from the HTTP Request and returns a query object
 * for prisma.adviser.findMany
 * @param query The raw query object from the HTTP Request
 * @returns A filter object that works with prisma.adviser.findMany
 */
export const getFilteredAdvisersWhereInputParser = (query: any) => {
  let filter: Prisma.AdviserFindManyArgs = {};

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

  if (query.cohortYear) {
    filter = { ...filter, where: { cohortYear: Number(query.cohortYear) } };
  }

  return filter;
};

/**
 * @function getFilteredAdvisers Retrieve a list of advisers that match the given query parameters
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Adviser Records that match the given query
 */
export const getFilteredAdvisers = async (query: any) => {
  const filteredQuery = getFilteredAdvisersWhereInputParser(query);
  const advisers = await getManyAdvisers(filteredQuery);
  const parsedAdvisers = advisers.map((adviser) =>
    getAdviserInputParser(adviser)
  );
  return parsedAdvisers;
};

export const createNewAdviserParser = async (
  body: any,
  isDev: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  adviser: Prisma.AdviserCreateInput & { cohortYear: number };
}> => {
  const { adviser, user } = body;
  if (!adviser || !user || (isDev && !user.password)) {
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

  return { adviser, user };
};

export const createNewAdviser = async (body: any, isDev?: boolean) => {
  const account = await createNewAdviserParser(body, isDev ?? false);

  const { user, adviser } = account;
  const { cohortYear, ...adviserData } = adviser;

  const [createdUser, createdAdviser] = await prismaClient.$transaction([
    prismaClient.user.create({ data: user }),
    prismaClient.adviser.create({
      data: {
        ...adviserData,
        user: { connect: { email: user.email } },
        cohort: { connect: { academicYear: cohortYear } },
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
    adviser: createdAdviser,
  };
};

export const createManyAdvisersParser = async (
  body: any,
  isDev: boolean
): Promise<
  {
    user: Prisma.UserCreateInput;
    adviser: Prisma.AdviserCreateInput & { cohortYear: number };
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
      adviser: Adviser;
    }): Promise<{ user: User; adviser: Adviser & { cohortYear: number } }> => {
      if (isDev && !account.user.password) {
        throw new SkylabError(
          "All accounts should have a password input",
          HttpStatusCode.BAD_REQUEST
        );
      }
      const { user, adviser } = account;
      const password =
        isDev && user.password
          ? await hashPassword(user.password)
          : await generateRandomHashedPassword();
      return {
        user: {
          ...user,
          password,
        },
        adviser,
      };
    }
  );
  await Promise.all(accounts);

  return accounts;
};

export const createManyAdvisers = async (body: any, isDev?: boolean) => {
  const accounts = await createManyAdvisersParser(body, isDev ?? false);
  const createdAccounts: Array<{
    user: Omit<User, "password">;
    adviser: Adviser & { cohortYear: number };
  }> = [];
  for (const account of accounts) {
    const { user, adviser } = account;
    const { cohortYear, ...adviserData } = adviser;
    const [createdUser, createdAdviser] = await prismaClient.$transaction([
      prismaClient.user.create({ data: user }),
      prismaClient.adviser.create({
        data: {
          ...adviserData,
          user: { connect: { email: user.email } },
          cohort: { connect: { academicYear: cohortYear } },
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...createdUserWithoutPassword } = createdUser;
    createdAccounts.push({
      user: createdUserWithoutPassword,
      adviser: createdAdviser,
    });
  }

  if (!isDev) {
    const mailingList = createdAccounts.map((account) => account.user.email);
    await sendPasswordResetEmail(mailingList);
  }
  return createdAccounts;
};

export const addAdviserToAccountParser = (
  body: any
): Prisma.AdviserCreateInput & { cohortYear: number } => {
  if (!body.adviser) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  return body.adviser;
};

export const addAdviserToAccount = async (userId: string, body: any) => {
  const adviser = addAdviserToAccountParser(body);
  const { cohortYear, ...adviserData } = adviser;
  return await createOneAdviser({
    data: {
      ...adviserData,
      cohort: { connect: { academicYear: cohortYear } },
      user: { connect: { id: Number(userId) } },
    },
  });
};
