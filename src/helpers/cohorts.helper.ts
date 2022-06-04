import { getFirstCohort, getManyCohorts } from "src/models/cohorts.db";

/**
 * @function getLatestCohort Get the most recent cohort
 * @returns The most recent cohort record by academicYear
 */
export const getLatestCohort = async () => {
  return await getFirstCohort({ orderBy: { academicYear: "desc" } });
};

/**
 * @function getAllCohorts Get all the cohorts in the database
 * @returns All the cohort records in the database
 */
export const getAllCohorts = async () => {
  return await getManyCohorts({});
};
