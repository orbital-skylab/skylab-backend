import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { getCurrentCohort } from "src/helpers/cohorts.helper";
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
export const getOneUser = async (
  query: Prisma.UserFindUniqueArgs,
  includePassword?: boolean
) => {
  const queryParams = { ...query, rejectOnNotFound: false };
  const user = await prisma.user.findUnique(queryParams);

  if (!user) {
    throw new SkylabError("User was not found", HttpStatusCode.NOT_FOUND);
  }

  return {
    ...user,
    password: includePassword ? user.password : null,
  };
};

/**
 * @function getOneUserWithRoleData Find a unique user record (including role data) with the given query conditions
 * @param query The query conditions for the user
 * @returns The mentor record that matches the query conditions
 */
// TODO: cache in node memory
export const getOneUserWithRoleData = async (
  query: Prisma.UserFindUniqueArgs
) => {
  const { academicYear } = await getCurrentCohort();
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
      facilitator: {
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
  const users = await prisma.user.findMany(query);
  return users;
};

/**
 * @function updateOneUser Update one user based on the given unique condition
 * @param query The unique identifier for the user to update
 */
export const updateOneUser = async (query: Prisma.UserUpdateArgs) => {
  try {
    return await prisma.user.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

export const createOneUser = async (query: Prisma.UserCreateArgs) => {
  try {
    const createdUser = await prisma.user.create(query);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...createdUserWithoutPassword } = createdUser;
    return createdUserWithoutPassword;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "User is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const createManyUsers = async (queries: Prisma.UserCreateArgs[]) => {
  try {
    const createdUsers = await Promise.all(
      queries.map((query) => prisma.user.create(query))
    );
    return createdUsers.map((createdUser) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...createdUserWithoutPassword } = createdUser;
      return createdUserWithoutPassword;
    });
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Some users are not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const deleteOneUser = async (query: Prisma.UserDeleteArgs) => {
  try {
    return await prisma.user.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};
