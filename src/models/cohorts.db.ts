import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstCohort Find the first cohort that matches the given query conditions
 * @param query The query conditions to retrieve the cohort by
 * @returns The first cohort that matches the given query conditions
 */
export const getFirstCohort = async (query: Prisma.CohortFindFirstArgs) => {
  const cohort = await prisma.cohort.findFirst({
    ...query,
    rejectOnNotFound: false,
  });

  if (!cohort) {
    throw new SkylabError("Cohort was not found", HttpStatusCode.BAD_REQUEST);
  }

  return cohort;
};

/**
 * @function getOneCohort Find the cohort that matches the given unique query conditions
 * @param query The unique query conditions to retrieve the cohort by
 * @returns The unique cohort that matches the given query conditions
 */
export const getOneCohort = async (query: Prisma.CohortFindUniqueArgs) => {
  const cohort = await prisma.cohort.findUnique({
    ...query,
    rejectOnNotFound: false,
  });

  if (!cohort) {
    throw new SkylabError("Cohort was not found", HttpStatusCode.BAD_REQUEST);
  }

  return cohort;
};

/**
 * @function getManyCohorts Find the cohorts that match the given query conditions
 * @param query The query conditions to retrieve the cohorts by
 * @returns An array of cohort records that match the given query conditions
 */
export const getManyCohorts = async (query: Prisma.CohortFindManyArgs) => {
  const cohorts = await prisma.cohort.findMany(query);
  return cohorts;
};

/**
 * @function createCohort Create a new cohort
 * @param cohort Information of the cohort to be created
 * @returns Cohort object created in the database
 */
export const createCohort = async (cohort: Prisma.CohortCreateInput) => {
  try {
    const newCohort = await prisma.cohort.create({ data: cohort });
    return newCohort;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError("Cohort is not unique", HttpStatusCode.BAD_REQUEST);
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

export const editCohort = async (query: Prisma.CohortUpdateArgs) => {
  try {
    return await prisma.cohort.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const deleteCohort = async (query: Prisma.CohortDeleteArgs) => {
  try {
    return await prisma.cohort.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};
