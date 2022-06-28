import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstAdministrator Find the first administrator record with the given query conditions
 * @param query The query conditions for the user
 * @returns The first administrator record that matches the query conditions
 */
export const getFirstAdministrator = async ({
  include,
  ...query
}: Prisma.AdministratorFindFirstArgs) => {
  const administrator = await prisma.administrator.findFirst({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!administrator) {
    throw new SkylabError(
      "Administrator was not found",
      HttpStatusCode.NOT_FOUND
    );
  }

  return administrator;
};

/**
 * @function getOneAdministrator Find a unique administrator record with the given query conditions
 * @param query The query conditions for the user
 * @returns The administrator record that matches the query conditions
 */
export const getOneAdministrator = async ({
  include,
  ...query
}: Prisma.AdministratorFindUniqueArgs) => {
  const administrator = await prisma.administrator.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!administrator) {
    throw new SkylabError(
      "Administrator was not found",
      HttpStatusCode.NOT_FOUND
    );
  }
  return administrator;
};

/**
 * @function getManyAdministrators Find all the administrators that match the given query conditions
 * @param query The query conditions to be selected upon
 * @returns The array of administrator records that match the query conditions
 */
export const getManyAdministrators = async ({
  include,
  ...query
}: Prisma.AdministratorFindManyArgs) => {
  const administrators = await prisma.administrator.findMany({
    include: { ...include, user: true },
    ...query,
  });
  return administrators;
};

export const createOneAdministrator = async (
  administrator: Prisma.AdministratorCreateArgs
) => {
  try {
    return await prisma.administrator.create(administrator);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Administrator is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const createManyAdministrators = async (
  administrators: Prisma.AdministratorCreateManyArgs
) => {
  try {
    return await prisma.administrator.createMany(administrators);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "One of the administrators are not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }
  }
};
