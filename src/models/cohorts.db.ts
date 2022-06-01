import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getCurrentCohort Get information on the latest cohort
 * @returns The record containing the latest cohort information
 */
export const getCurrentCohort = async () => {
  const currentCohort = await prisma.cohort.findFirst({
    orderBy: { endDate: "desc" },
  });
  return currentCohort;
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
    console.log(e);
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError("Cohort is not unique", HttpStatusCode.BAD_REQUEST);
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
