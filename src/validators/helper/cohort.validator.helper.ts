import { getOneCohort } from "../../models/cohorts.db";

export const checkCohortExists = async (cohortYear: number) => {
  try {
    const cohort = await getOneCohort({ where: { academicYear: cohortYear } });
    if (cohort) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};
