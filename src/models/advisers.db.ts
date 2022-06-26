import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstAdviser Find the first adviser record with the given query conditions
 * @param query The query conditions for the user
 * @returns The first adviser record that matches the query conditions
 */
export const getFirstAdviser = async ({
  include,
  ...query
}: Prisma.AdviserFindFirstArgs) => {
  const adviser = await prisma.adviser.findFirst({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!adviser) {
    throw new SkylabError("Adviser was not found", HttpStatusCode.NOT_FOUND);
  }

  return adviser;
};

/**
 * @function getOneAdviser Find a unique adviser record with the given query conditions
 * @param query The query conditions for the user
 * @returns The adviser record that matches the query conditions
 */
export const getOneAdviser = async ({
  include,
  ...query
}: Prisma.AdviserFindUniqueArgs) => {
  const adviser = await prisma.adviser.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!adviser) {
    throw new SkylabError("Adviser was not found", HttpStatusCode.NOT_FOUND);
  }

  return adviser;
};

/**
 * @function getManyAdvisers Find all the advisers that match the given query conditions
 * @param query The query conditions to be selected upon
 * @returns The array of adviser records that match the query conditions
 */
export const getManyAdvisers = async ({
  include,
  ...query
}: Prisma.AdviserFindManyArgs) => {
  const advisers = await prisma.adviser.findMany({
    include: { ...include, user: true },
    ...query,
  });

  return advisers;
};

export const createOneAdviser = async (adviser: Prisma.AdviserCreateArgs) => {
  try {
    return await prisma.adviser.create(adviser);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Adviser is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const createManyAdvisers = async (
  advisers: Prisma.AdviserCreateManyArgs
) => {
  try {
    return await prisma.adviser.createMany(advisers);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "One of the advisers are not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }
  }
};
