import { type PrismaClient } from "@prisma/client";

export const cohort1 = {
  startDate: new Date("2022-07-06T14:48:09.274Z"),
  endDate: new Date("2023-07-06T14:48:09.274Z"),
  academicYear: 2022,
};
export const cohort2 = {
  startDate: new Date("2023-07-06T14:48:09.274Z"),
  endDate: new Date("2024-07-06T14:48:09.274Z"),
  academicYear: 2023,
};
export const cohort3 = {
  startDate: new Date("2024-07-06T14:48:09.274Z"),
  endDate: new Date("2025-07-06T14:48:09.274Z"),
  academicYear: 2024,
};

export const cohorts = [cohort1, cohort2, cohort3];

export const seedCohorts = async (prisma: PrismaClient) => {
  await prisma.cohort.createMany({ data: cohorts });
};
