/* eslint-disable @typescript-eslint/no-explicit-any */

import { Prisma } from "@prisma/client";
import {
  createFacilitator,
  createManyFacilitators,
  getFirstFacilitator,
  getManyFacilitators,
} from "src/models/facilitator.db";

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

export const getFacilitatorByEmail = async (email: string) => {
  const facilitator = await getFirstFacilitator({
    where: { user: { email: email } },
    orderBy: { cohortYear: "desc" },
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

/**
 * @function createFacilitatorInputParser Parse the query body received from the
 * HTTP Request to be passed to prisma.facilitator.create
 * @param body The raw query from the HTTP Request
 * @return The create input to be passed to prisma.facilitator.create
 */
export const createFacilitatorInputParser = (
  body: any
): {
  user: Prisma.UserCreateInput;
  cohortYear: number;
} => {
  const { cohortYear, ...user } = body;
  const userData = <Prisma.UserCreateInput>user;
  return {
    user: userData,
    cohortYear: Number(cohortYear),
  };
};

/**
 * @function createFacilitatorHelper Helper function to create a facilitator
 * @param body The facilitator information from the HTTP Request
 * @returns The facilitator record created in the database
 */
export const createFacilitatorHelper = async (body: any) => {
  const { user, cohortYear } = createFacilitatorInputParser(body);
  return await createFacilitator(user, {
    cohort: { connect: { academicYear: cohortYear } },
  });
};

/**
 * @function createManyFacilitatorHelper Helper function to create many facilitators simultaenously
 * @param body The array of facilitator data objects from the HTTP Request
 * @returns The facilitator records created in the database
 */
export const createManyFacilitatorsHelper = async (
  body: { user: Prisma.UserCreateInput; cohortYear: number }[]
) => {
  const facilitators = body.map((data) => {
    const { user, cohortYear } = data;
    return {
      user: user,
      facilitator: { cohort: { connect: { academicYear: cohortYear } } },
    };
  });
  return await createManyFacilitators(facilitators);
};
