/* eslint-disable @typescript-eslint/no-explicit-any */
import { Adviser, Prisma, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneAdviser,
  getManyAdvisers,
  getOneAdviser,
} from "src/models/advisers.db";
import { createOneUser, createManyUsers } from "src/models/users.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { hashPassword, generateRandomHashedPassword } from "./users.helper";

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
  isAdmin: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  adviser: Prisma.AdviserCreateInput;
}> => {
  const { adviser, user } = body;
  if (!adviser || !user || (isAdmin && !user.password)) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password = user.password
    ? await hashPassword(user.password)
    : await generateRandomHashedPassword();

  return {
    user,
    adviser,
  };
};

export const createNewAdviser = async (body: any, isAdmin?: boolean) => {
  const account = await createNewAdviserParser(body, isAdmin ?? false);

  return await createOneUser({
    data: { ...account.user, adviser: { create: account.adviser } },
  });
};

export const createManyAdvisersParser = async (
  body: any,
  isAdmin: boolean
): Promise<
  {
    user: Prisma.UserCreateInput;
    adviser: Prisma.AdviserCreateInput;
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

  const promises: Promise<string>[] = [];
  accounts.forEach((account: { adviser: Adviser; user: User }) => {
    const { user } = account;

    if (isAdmin && !user.password) {
      throw new SkylabError(
        "All accounts should have a password input",
        HttpStatusCode.BAD_REQUEST
      );
    }

    promises.push(
      user.password
        ? hashPassword(user.password)
        : generateRandomHashedPassword()
    );
  });

  await Promise.all(promises);
  return accounts;
};

export const createManyAdvisers = async (body: any, isAdmin?: boolean) => {
  const accounts = await createManyAdvisersParser(body, isAdmin ?? false);
  const prismaArgsArray: Prisma.UserCreateArgs[] = accounts.map((account) => {
    return { data: { ...account.user, adviser: { create: account.adviser } } };
  });
  return await createManyUsers(prismaArgsArray);
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
