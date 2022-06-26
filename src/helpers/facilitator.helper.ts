/* eslint-disable @typescript-eslint/no-explicit-any */

import { Facilitator, Prisma, PrismaClient, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneFacilitator,
  getManyFacilitators,
  getOneFacilitator,
} from "src/models/facilitator.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  hashPassword,
  generateRandomHashedPassword,
  sendPasswordResetEmail,
} from "./users.helper";

const prismaClient = new PrismaClient();

/**
 * @function getFacilitatorInputParser Parse the input returned from the prisma.facilitator.find function
 * @param facilitator The payload returned from prisma.facilitator.find
 * @returns Flattened object with both User and Facilitator Data
 */
export const getFacilitatorInputParser = (
  facilitator: Prisma.FacilitatorGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = facilitator;
  return { ...user, ...data, facilitatorId: id };
};

export const getFacilitatorById = async (facilitatorId: string) => {
  const facilitator = await getOneFacilitator({
    where: { id: Number(facilitatorId) },
  });
  return getFacilitatorInputParser(facilitator);
};

/**
 * @function getFilteredFacilitatorsWhereInputParser Parse the query from the HTTP Request
 * and returns a query object for prisma.facilitator.findMany
 * @param query The raw query object from the HTTP Request
 * @returns A filter object that works with prisma.facilitator.findMany
 */
export const getFilteredFacilitatorsWhereInputParser = (query: any) => {
  let filter: Prisma.FacilitatorFindManyArgs = {};

  if (query.page && query.limit) {
    filter = {
      take: Number(query.limit),
      skip: (query.page - 1) * query.limit,
    };
  }

  if (query.cohortYear) {
    filter = { ...filter, where: { cohortYear: Number(query.cohortYear) } };
  }

  return filter;
};

/**
 * @function getFilteredFacilitators Retrieve a list of facilitators that match the given query parameters
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Facilitator Records that match the given query
 */
export const getFilteredFacilitators = async (query: any) => {
  const filteredQuery = getFilteredFacilitatorsWhereInputParser(query);
  const facilitators = await getManyFacilitators(filteredQuery);
  const parsedFacilitators = facilitators.map((facilitator) =>
    getFacilitatorInputParser(facilitator)
  );
  return parsedFacilitators;
};

export const createNewFacilitatorParser = async (
  body: any,
  isDev: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  facilitator: Prisma.FacilitatorCreateInput & { cohortYear: number };
}> => {
  const { facilitator, user } = body;
  if (!facilitator || !user || (isDev && !user.password)) {
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

  return { facilitator, user };
};

export const createNewFacilitator = async (body: any, isDev?: boolean) => {
  const account = await createNewFacilitatorParser(body, isDev ?? false);

  const { user, facilitator } = account;
  const { cohortYear, ...facilitatorData } = facilitator;

  const [createdUser, createdFacilitator] = await prismaClient.$transaction([
    prismaClient.user.create({ data: user }),
    prismaClient.facilitator.create({
      data: {
        ...facilitatorData,
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
    facilitator: createdFacilitator,
  };
};

export const createManyFacilitatorsParser = async (
  body: any,
  isDev: boolean
): Promise<
  {
    user: Prisma.UserCreateInput;
    facilitator: Prisma.FacilitatorCreateInput & { cohortYear: number };
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
      facilitator: Facilitator;
    }): Promise<{
      user: User;
      facilitator: Facilitator & { cohortYear: number };
    }> => {
      if (isDev && !account.user.password) {
        throw new SkylabError(
          "All accounts should have a password input",
          HttpStatusCode.BAD_REQUEST
        );
      }
      const { user, facilitator } = account;
      const password =
        isDev && user.password
          ? await hashPassword(user.password)
          : await generateRandomHashedPassword();
      return {
        user: {
          ...user,
          password,
        },
        facilitator,
      };
    }
  );
  await Promise.all(accounts);

  return accounts;
};

export const createManyFacilitators = async (body: any, isDev?: boolean) => {
  const accounts = await createManyFacilitatorsParser(body, isDev ?? false);
  const createdAccounts: Array<{
    user: Omit<User, "password">;
    facilitator: Facilitator & { cohortYear: number };
  }> = [];
  for (const account of accounts) {
    const { user, facilitator } = account;
    const { cohortYear, ...facilitatorData } = facilitator;
    const [createdUser, createdFacilitator] = await prismaClient.$transaction([
      prismaClient.user.create({ data: user }),
      prismaClient.facilitator.create({
        data: {
          ...facilitatorData,
          user: { connect: { email: user.email } },
          cohort: { connect: { academicYear: cohortYear } },
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...createdUserWithoutPassword } = createdUser;
    createdAccounts.push({
      user: createdUserWithoutPassword,
      facilitator: createdFacilitator,
    });
  }

  if (!isDev) {
    const mailingList = createdAccounts.map((account) => account.user.email);
    await sendPasswordResetEmail(mailingList);
  }
  return createdAccounts;
};

export const addFacilitatorToAccountParser = (
  body: any
): Prisma.FacilitatorCreateInput & { cohortYear: number } => {
  if (!body.facilitator) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  return body.facilitator;
};

export const addFacilitatorToAccount = async (userId: string, body: any) => {
  const facilitator = addFacilitatorToAccountParser(body);
  const { cohortYear, ...facilitatorData } = facilitator;
  return await createOneFacilitator({
    data: {
      ...facilitatorData,
      cohort: { connect: { academicYear: cohortYear } },
      user: { connect: { id: Number(userId) } },
    },
  });
};
