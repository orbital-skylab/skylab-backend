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

interface IAdviserCreateMany {
  user: Prisma.UserCreateInput;
  adviser: Omit<Prisma.AdviserCreateInput, "user">;
}

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
