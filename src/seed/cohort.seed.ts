import { createCohort } from "src/models/cohorts.db";

export const seedCohorts = async () => {
  await createCohort({
    startDate: new Date("2020-07-06T14:48:09.274Z"),
    endDate: new Date("2021-07-06T14:48:09.274Z"),
    academicYear: 2020,
  });
  await createCohort({
    startDate: new Date("2021-07-06T14:48:09.274Z"),
    endDate: new Date("2022-07-06T14:48:09.274Z"),
    academicYear: 2021,
  });
  await createCohort({
    startDate: new Date("2022-07-06T14:48:09.274Z"),
    endDate: new Date("2023-07-06T14:48:09.274Z"),
    academicYear: 2022,
  });
  await createCohort({
    startDate: new Date("2023-07-06T14:48:09.274Z"),
    endDate: new Date("2024-07-06T14:48:09.274Z"),
    academicYear: 2023,
  });
  await createCohort({
    startDate: new Date("2024-07-06T14:48:09.274Z"),
    endDate: new Date("2025-07-06T14:48:09.274Z"),
    academicYear: 2024,
  });
};
