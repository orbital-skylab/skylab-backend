import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

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
    throw new SkylabError("Adviser was not found", HttpStatusCode.BAD_REQUEST);
  }

  return adviser;
};

/**
 * @function getManyAdvisers Find many advisers that match the given query conditions
 * @param query The query conditions for the advisers to be selected
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

/**
 * @function createAdviser Create an Adviser with an associated User Record
 * @param user The information to create the User Record
 * @param adviser The information to create the Adviser Record
 * @returns The adviser object that was created
 */
export const createAdviser = async (
  user: Prisma.UserCreateInput,
  adviser: Omit<Prisma.AdviserCreateInput, "user">
) => {
  try {
    const createdAdviser = await prisma.adviser.create({
      data: { user: { create: user }, ...adviser },
    });
    return createdAdviser;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Adviser is not unique",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

export interface IAdviserCreateMany {
  user: Prisma.UserCreateInput;
  adviser: Omit<Prisma.AdviserCreateInput, "user">;
}

/**
 * @function createAdviser Create many Advisers with associated User Records
 * @param data The array of data to create the Adviser Records With
 * @returns The array of adviser objects created
 */
export const createManyAdvisers = async (data: IAdviserCreateMany[]) => {
  try {
    const createdAdvisers = await Promise.all(
      data.map(async (userData) => {
        return await prisma.adviser.create({
          data: { user: { create: userData.user }, ...userData.adviser },
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
        `Adviser ${e.meta} is not unique`,
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
