import { getFirstCohort, getManyCohorts } from "src/models/cohorts.db";

export const getLatestCohort = async () => {
  return await getFirstCohort({ orderBy: { academicYear: "desc" } });
};

export const getAllCohorts = async () => {
  return await getManyCohorts({});
};
