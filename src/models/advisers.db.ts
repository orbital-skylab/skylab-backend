import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getAdviserByEmail Get adviser record with the given email
 * @param email The email fo the adviser record to be retrieved
 * @returns The adviser with the given email
 */
export const getAdviserByEmail = async (email: string) => {
  const adviserWithEmail = await prisma.user.findUnique({
    where: { email: email },
    include: { adviser: true },
    rejectOnNotFound: false,
  });

  if (adviserWithEmail == null || adviserWithEmail?.adviser == null) {
    throw new SkylabError(
      "Adviser with given email was not found",
      HttpStatusCode.NOT_FOUND
    );
  }

  return adviserWithEmail;
};

/**
 * @function getAllAdvisers Return all advisers in the database
 * @returns All Adviser records in the database
 */
export const getAllAdvisers = async () => {
  const allAdvisers = await prisma.user.findMany({
    where: { adviser: { isNot: null } },
    include: { adviser: true },
  });

  return allAdvisers;
};

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
