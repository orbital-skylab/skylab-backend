/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import {
  hashPassword,
  generateRandomHashedPassword,
} from "src/helpers/users.helper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prismaClient = new PrismaClient();

/**
 * @function getFirstAdministrator Find the first administrator record with the given query conditions
 * @param query The query conditions for the user
 * @returns The first administrator record that matches the query conditions
 */
export const getFirstAdministrator = async ({
  include,
  ...query
}: Prisma.AdministratorFindFirstArgs) => {
  const administrator = await prismaClient.administrator.findFirst({
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
  const administrator = await prismaClient.administrator.findUnique({
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
  const administrators = await prismaClient.administrator.findMany({
    include: { ...include, user: true },
    ...query,
  });
  return administrators;
};

export const createNewAdministratorParser = async (
  body: any,
  isDev: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  administrator: Prisma.AdministratorCreateInput;
}> => {
  const { administrator, user } = body;
  if (!administrator || !user || (isDev && !user.password)) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password =
    isDev && user.password
      ? await hashPassword(user.password)
      : await generateRandomHashedPassword();

  return {
    user,
    administrator,
  };
};

export const createOneAdministrator = async (body: any, isDev?: boolean) => {
  try {
    const { user, administrator } = await createNewAdministratorParser(
      body,
      isDev ?? false
    );

    const [createdUser, createdAdministrator] = await prismaClient.$transaction(
      [
        prismaClient.user.create({ data: user }),
        prismaClient.administrator.create({
          data: {
            ...administrator,
            user: { connect: { email: user.email } },
          },
        }),
      ]
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...createdUserWithoutPassword } = createdUser;
    return {
      ...createdUserWithoutPassword,
      administrator: createdAdministrator,
    };
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
    return await prismaClient.administrator.createMany(administrators);
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
