import { createCohort } from "src/models/cohorts.db";

export const cohort1 = {
  startDate: new Date("2020-07-06T14:48:09.274Z"),
  endDate: new Date("2021-07-06T14:48:09.274Z"),
  academicYear: 2020,
};
export const cohort2 = {
  startDate: new Date("2021-07-06T14:48:09.274Z"),
  endDate: new Date("2022-07-06T14:48:09.274Z"),
  academicYear: 2021,
};
export const cohort3 = {
  startDate: new Date("2022-07-06T14:48:09.274Z"),
  endDate: new Date("2023-07-06T14:48:09.274Z"),
  academicYear: 2022,
};
export const cohort4 = {
  startDate: new Date("2023-07-06T14:48:09.274Z"),
  endDate: new Date("2024-07-06T14:48:09.274Z"),
  academicYear: 2023,
};
export const cohort5 = {
  startDate: new Date("2024-07-06T14:48:09.274Z"),
  endDate: new Date("2025-07-06T14:48:09.274Z"),
  academicYear: 2024,
};

export const cohorts = [cohort1, cohort2, cohort3, cohort4, cohort5];

export const seedCohorts = async () => {
  await createCohort(cohort1);
  await createCohort(cohort2);
  await createCohort(cohort3);
  await createCohort(cohort4);
  await createCohort(cohort5);
};
