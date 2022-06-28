import { Prisma } from "@prisma/client";
import {
  deleteCohort,
  editCohort,
  getFirstCohort,
  getManyCohorts,
} from "src/models/cohorts.db";

/**
 * @function getLatestCohort Get the most recent cohort
 * @returns The most recent cohort record by academicYear
 */
export const getCurrentCohort = async () => {
  try {
    return await getFirstCohort({
      where: { startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      orderBy: { academicYear: "desc" },
    });
  } catch {
    try {
      return await getFirstCohort({
        where: {
          startDate: { gte: new Date() },
        },
        orderBy: { academicYear: "asc" },
      });
    } catch {
      return await getFirstCohort({
        where: { endDate: { lte: new Date() } },
        orderBy: { academicYear: "desc" },
      });
    }
  }
};

/**
 * @function getAllCohorts Get all the cohorts in the database
 * @returns All the cohort records in the database
 */
export const getAllCohorts = async () => {
  return await getManyCohorts({ orderBy: { academicYear: "asc" } });
};

export const editCohortByYear = async (
  cohortYear: number,
  data: Prisma.CohortUpdateInput
) => {
  return await editCohort({ where: { academicYear: cohortYear }, data: data });
};

export const deleteCohortByYear = async (cohortYear: number) => {
  return await deleteCohort({ where: { academicYear: cohortYear } });
};
