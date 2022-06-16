/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { createDeadline, getManyDeadlines } from "src/models/deadline.db";

export const getFilteredDeadlinesWhereInputParser = (query: any) => {
  let filter: Prisma.DeadlineFindManyArgs = {};

  if (query.page && query.limit) {
    filter = {
      take: Number(query.limit),
      skip: (query.page - 1) & query.limit,
    };
  }

  if (query.cohortYear) {
    filter = {
      ...filter,
      where: { cohortYear: Number(query.cohortYear) },
    };
  }

  if (query.type) {
    const { where, ...data } = filter;
    filter = {
      ...data,
      where: { ...where, type: query.type },
    };
  }

  if (query.id) {
    const { where, ...data } = filter;
    filter = {
      ...data,
      where: { ...where, id: Number(query.id) },
    };
  }

  return filter;
};

export const getFilteredDeadlines = async (query: any) => {
  const filteredQuery = getFilteredDeadlinesWhereInputParser(query);
  const deadlines = await getManyDeadlines(filteredQuery);
  return deadlines;
};

export const createDeadlineInputParser = (
  body: any
): {
  deadline: Omit<Prisma.DeadlineCreateInput, "cohort">;
  cohortYear: number;
} => {
  const { cohortYear, ...deadline } = body;
  const deadlineData = <Omit<Prisma.DeadlineCreateInput, "cohort">>deadline;
  return {
    cohortYear: Number(cohortYear),
    deadline: deadlineData,
  };
};

export const createDeadlineHelper = async (body: any) => {
  const { deadline, cohortYear } = createDeadlineInputParser(body);
  return await createDeadline(deadline, cohortYear);
};
