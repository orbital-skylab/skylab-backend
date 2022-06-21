/* eslint-disable @typescript-eslint/no-explicit-any */

import { Facilitator, Prisma, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneFacilitator,
  getManyFacilitators,
  getOneFacilitator,
} from "src/models/facilitator.db";
import { createOneUser, createManyUsers } from "src/models/users.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  hashPassword,
  generateRandomHashedPassword,
  sendPasswordResetEmail,
} from "./users.helper";

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
  isAdmin: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  facilitator: Prisma.FacilitatorCreateInput;
}> => {
  const { facilitator, user } = body;
  if (!facilitator || !user || (isAdmin && !user.password)) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password =
    isAdmin && user.password
      ? await hashPassword(user.password)
      : await generateRandomHashedPassword();

  return {
    user,
    facilitator,
  };
};

export const createNewFacilitator = async (
  body: any,
  isAdmin?: boolean
): Promise<User> => {
  const account = await createNewFacilitatorParser(body, isAdmin ?? false);
  const createdUser = await createOneUser({
    data: { ...account.user, facilitator: { create: account.facilitator } },
  });
  if (!isAdmin) {
    await sendPasswordResetEmail([createdUser.email]);
  }
  return createdUser;
};

export const createManyFacilitatorsParser = async (
  body: any,
  isAdmin: boolean
): Promise<
  {
    user: Prisma.UserCreateInput;
    facilitator: Prisma.FacilitatorCreateInput;
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
  accounts.forEach((account: { facilitator: Facilitator; user: User }) => {
    const { user } = account;

    if (isAdmin && !user.password) {
      throw new SkylabError(
        "All accounts should have a password input",
        HttpStatusCode.BAD_REQUEST
      );
    }

    promises.push(
      isAdmin && user.password
        ? hashPassword(user.password)
        : generateRandomHashedPassword()
    );
  });

  await Promise.all(promises);
  return accounts;
};

export const createManyFacilitators = async (
  body: any,
  isAdmin?: boolean
): Promise<User[]> => {
  const accounts = await createManyFacilitatorsParser(body, isAdmin ?? false);
  const prismaArgsArray: Prisma.UserCreateArgs[] = accounts.map((account) => {
    return {
      data: { ...account.user, facilitator: { create: account.facilitator } },
    };
  });
  const createdUsers = await createManyUsers(prismaArgsArray);
  if (!isAdmin) {
    const mailingList = createdUsers.map((user) => user.email);
    await sendPasswordResetEmail(mailingList);
  }
  return createdUsers;
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
