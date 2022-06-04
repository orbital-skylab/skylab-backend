/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import {
  createAdviser,
  createManyAdvisers,
  getFirstAdviser,
  getManyAdvisers,
} from "src/models/advisers.db";

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

/**
 * @function getAdviserByEmail Retrieve an adviser with the given email
 * @param email The email of the adviser to retrieve
 * @returns The adviser record with the given email
 */
export const getAdviserByEmail = async (email: string) => {
  const adviser = await getFirstAdviser({
    where: { user: { email: email } },
    orderBy: { cohortYear: "desc" },
  });
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

/**
 * @function createAdviserHelper Helper function to create an adviser
 * @param body The adviser information from the HTTP Request
 * @returns The adviser record created in the database
 */
export const createAdviserHelper = async (body: {
  user: Prisma.UserCreateInput;
  cohortYear: number;
}) => {
  const { user, cohortYear } = body;
  return await createAdviser(user, {
    cohort: { connect: { academicYear: cohortYear } },
  });
};

/**
 * @function createManyAdvisersHelper Helper function to create many advisers simultaenously
 * @param body The array of adviser datum from the HTTP Request
 * @returns The adviser records created in the database
 */
export const createManyAdvisersHelper = async (
  body: { user: Prisma.UserCreateInput; cohortYear: number }[]
) => {
  const advisers = body.map((data) => {
    const { user, cohortYear } = data;
    return {
      user: user,
      adviser: { cohort: { connect: { academicYear: cohortYear } } },
    };
  });
  return await createManyAdvisers(advisers);
};
