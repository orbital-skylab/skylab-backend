import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

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
    throw new SkylabError("Adviser was not found", HttpStatusCode.BAD_REQUEST);
  }

  return adviser;
};

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

export const createAdviser = async (user: Prisma.UserCreateInput, cohortYear: number) => {
  try {
    const newAdviser = await prisma.adviser.create({
      data: { user: { create: user }, cohort: {connectOrCreate: { where: {cohortYear: cohortYear}, connect: {cohortYear: cohortYear}}}}
    })
  }
}

/**
 * @function createAdviserUser Create User with the associated Adviser Record in the database
 * @param user Information of user to be created
 * @returns User/Adviser Record created in the database
 */
export const createAdviserUser = async (user: Prisma.UserCreateInput) => {
  try {
    const newUser = await prisma.user.create({
      data: { ...user, adviser: { create: {} } },
    });

    return newUser;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError("User is not unique", HttpStatusCode.BAD_REQUEST);
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

/**
 * @function createManyAdviserUsers Function to create adviser users in the database
 * @param users Array of users to create adviser accounts for
 * @returns The users that were created
 */
export const createManyAdviserUsers = async (
  users: Prisma.UserCreateInput[]
) => {
  try {
    const createdAdvisers = await Promise.all(
      users.map(async (user) => {
        return await prisma.user.create({
          data: { ...user, adviser: { create: {} } },
        });
      })
    );
    return createdAdvisers;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        `User with information: ${e.meta} is not unique`,
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
