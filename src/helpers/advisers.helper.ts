/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createAdviser,
  createManyAdvisers,
  getManyAdvisers,
  IAdviserCreateMany,
} from "src/models/advisers.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export const getAdviserInputParser = (
  adviser: Prisma.AdviserGetPayload<{ include: { user: true } }>
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, id, ...data } = adviser;
  const parsedAdviser = { ...user, ...data, adviserId: id };
  return parsedAdviser;
};

export const getAdviserByEmail = async (email: string) => {
  const adviser = await getManyAdvisers({ where: { user: { email: email } } });

  if (adviser.length == 0) {
    throw new SkylabError(
      "Adviser with this email does not exist",
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (adviser.length > 1) {
    throw new SkylabError(
      "Database inconsistent, found two users with the same email",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
  return getAdviserInputParser(adviser[0]);
};

// currently supported filters: cohortYear, page, limit
export const getFilteredAdvisersWhereInputParser = (query: any) => {
  let filter: Prisma.AdviserFindManyArgs = {};

  if (query.page && query.limit) {
    filter = {
      take: Number(query.limit),
      skip: (query.page - 1) * query.limit,
    };
  }

  if (query.cohortYear) {
    filter = { ...filter, where: { cohortYear: Number(query.cohortYear) } };
  }

  return filter;
};

export const getFilteredAdvisers = async (query: any) => {
  const filteredQuery = getFilteredAdvisersWhereInputParser(query);
  const advisers = await getManyAdvisers(filteredQuery);
  const parsedAdvisers = advisers.map((adviser) =>
    getAdviserInputParser(adviser)
  );
  return parsedAdvisers;
};

export const createAdviserHelper = async (body: {
  user: Prisma.UserCreateInput;
  cohortYear: number;
}) => {
  const { user, cohortYear } = body;
  return await createAdviser(user, {
    cohort: { connect: { academicYear: cohortYear } },
  });
};

export const createManyAdvisersHelper = async (
  body: { user: Prisma.UserCreateInput; cohortYear: number }[]
) => {
  const advisers = body.map((data) => {
    const { user, cohortYear } = data;
    return {
      user: user,
      adviser: { cohort: { connect: { academicYear: cohortYear } } },
    };
  });
  return await createManyAdvisers(advisers);
};
