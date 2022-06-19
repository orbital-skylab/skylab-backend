import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { getLatestCohort } from "src/helpers/cohorts.helper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstUser Find the first user record with the given query conditions
 * @param query The query conditions for the user
 * @returns The first user record that matches the query conditions
 */
export const getFirstUser = async (query: Prisma.UserFindUniqueArgs) => {
  const queryParams = { ...query, rejectOnNotFound: false };
  const user = await prisma.user.findFirst(queryParams);

  if (!user) {
    throw new SkylabError("User was not found", HttpStatusCode.NOT_FOUND);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * @function getOneUser Find a unique user record with the given query conditions
 * @param query The query conditions for the user
 * @returns The mentor record that matches the query conditions
 */
export const getOneUser = async (query: Prisma.UserFindUniqueArgs) => {
  const queryParams = { ...query, rejectOnNotFound: false };
  const user = await prisma.user.findUnique(queryParams);

  if (!user) {
    throw new SkylabError("User was not found", HttpStatusCode.NOT_FOUND);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * @function getUserPassword Find a unique user record with the given query conditions
 * @param query The query conditions for the user
 * @returns The mentor record that matches the query conditions
 */
export const getUserPassword = async (query: Prisma.UserFindUniqueArgs) => {
  const queryParams = { ...query, rejectOnNotFound: false };
  const user = await prisma.user.findUnique(queryParams);

  if (!user) {
    throw new SkylabError("User was not found", HttpStatusCode.NOT_FOUND);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return user.password;
};

/**
 * @function getOneUser Find a unique user record with the given query conditions
 * @param query The query conditions for the user
 * @returns The mentor record that matches the query conditions
 */
export const getOneUserWithRoleData = async (
  query: Prisma.UserFindUniqueArgs
) => {
  const { academicYear } = await getLatestCohort();

  const queryParams = {
    ...query,
    include: {
      student: {
        where: {
          cohortYear: academicYear,
        },
      },
      mentor: {
        where: {
          cohortYear: academicYear,
        },
      },
      adviser: {
        where: {
          cohortYear: academicYear,
        },
      },
    },
    rejectOnNotFound: false,
  };
  const user = await prisma.user.findUnique(queryParams);

  if (!user) {
    throw new SkylabError("User was not found", HttpStatusCode.NOT_FOUND);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * @function getManyUsers Find all the users that match the given query condtions
 * @param query The query conditions to be selected upon
 * @returns The array of user records that match the query conditions
 */
export const getManyUsers = async (query: Prisma.UserFindManyArgs) => {
  const queryParams = {
    ...query,
    // exclude password
    select: {
      name: true,
      email: true,
      profilePicUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      personalSiteUrl: true,
      selfIntro: true,
    },
  };
  const users = await prisma.user.findMany(queryParams);
  return users;
};

/**
 * @function updateOneUser Update one user based on the given unique condition
 * @param query The unique identifier for the user to update
 */
export const updateOneUser = async (query: Prisma.UserUpdateArgs) => {
  try {
    await prisma.user.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

/**
 * @function deleteOneUser Delete one user based on the given unique condition
 * @param query The unique identifier for the user to delte
 */
export const deleteOneUser = async (query: Prisma.UserDeleteArgs) => {
  try {
    await prisma.user.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

/**
 * @function deleteManyUser Delete many users based on the given query conditions
 * @param query The query conditions to identify the users to delete
 */
export const deleteManyUser = async (query: Prisma.UserDeleteManyArgs) => {
  try {
    await prisma.user.deleteMany(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }
    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
