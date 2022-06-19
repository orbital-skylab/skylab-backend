import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstUser Find the first user record with the given query conditions
 * @param query The query conditions for the user
 * @returns The first user record that matches the query conditions
 */
export const getFirstUser = async (
  query: Prisma.UserFindUniqueArgs,
  selectAll?: boolean
) => {
  let queryParams = { ...query, rejectOnNotFound: false };
  if (!selectAll) {
    queryParams = {
      ...queryParams,
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
  }
  const user = await prisma.user.findFirst(queryParams);
  if (!user) {
    throw new SkylabError("User was not found", HttpStatusCode.NOT_FOUND);
  }

  return user;
};

/**
 * @function getOneUser Find a unique user record with the given query conditions
 * @param query The query conditions for the user
 * @returns The mentor record that matches the query conditions
 */
export const getOneUser = async (
  query: Prisma.UserFindUniqueArgs,
  selectAll?: boolean
) => {
  let queryParams = { ...query, rejectOnNotFound: false };
  if (!selectAll) {
    queryParams = {
      ...queryParams,
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
  }
  const user = await prisma.user.findUnique(queryParams);

  if (!user) {
    throw new SkylabError("User was not found", HttpStatusCode.NOT_FOUND);
  }

  return user;
};

/**
 * @function getManyUsers Find all the users that match the given query condtions
 * @param query The query conditions to be selected upon
 * @returns The array of user records that match the query conditions
 */
export const getManyUsers = async (
  query: Prisma.UserFindManyArgs,
  selectAll?: boolean
) => {
  const queryParams = selectAll
    ? query
    : {
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
    return await prisma.user.create(query);
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
    return await Promise.all(queries.map((query) => prisma.user.create(query)));
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
