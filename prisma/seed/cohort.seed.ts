import { type PrismaClient } from "@prisma/client";

const thisYear = new Date().getFullYear();

export const cohort1 = {
  startDate: new Date(thisYear - 1, 0, 1),
  endDate: new Date(thisYear - 1, 11, 31),
  academicYear: thisYear - 1,
};
export const cohort2 = {
  startDate: new Date(thisYear, 0, 1),
  endDate: new Date(thisYear, 11, 31),
  academicYear: thisYear,
};
export const cohort3 = {
  startDate: new Date(thisYear + 1, 0, 1),
  endDate: new Date(thisYear + 1, 11, 31),
  academicYear: thisYear + 1,
};

export const cohorts = [cohort1, cohort2, cohort3];

export const seedCohorts = async (prisma: PrismaClient) => {
  await prisma.cohort.createMany({ data: cohorts });
};
