import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstMentor Find the first mentor record with the given query conditions
 * @param query The query conditions for the user
 * @returns The first mentor record that matches the query conditions
 */
export const getFirstMentor = async ({
  include,
  ...query
}: Prisma.MentorFindFirstArgs) => {
  const mentor = await prisma.mentor.findFirst({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!mentor) {
    throw new SkylabError("Mentor was not found", HttpStatusCode.NOT_FOUND);
  }

  return mentor;
};

/**
 * @function getOneMentor Find a unique mentor record with the given query conditions
 * @param query The query conditions for the user
 * @returns The mentor record that matches the query conditions
 */
export const getOneMentor = async ({
  include,
  ...query
}: Prisma.MentorFindUniqueArgs) => {
  const mentor = await prisma.mentor.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!mentor) {
    throw new SkylabError("Mentor was not found", HttpStatusCode.NOT_FOUND);
  }
  return mentor;
};

/**
 * @function getManyMentors Find all the mentors that match the given query conditions
 * @param query The query conditions to be selected upon
 * @returns The array of mentor records that match the query conditions
 */
export const getManyMentors = async ({
  include,
  ...query
}: Prisma.MentorFindManyArgs) => {
  const mentors = await prisma.mentor.findMany({
    include: { ...include, user: true },
    ...query,
  });
  return mentors;
};

/**
 * @function createMentor Create a Mentor with an associated User Record
 * @param user The information to create the User Record
 * @param mentor The information to create the Mentor Record
 * @returns The mentor object that was created
 */
export const createMentor = async (
  user: Omit<Prisma.UserCreateInput, "userId">,
  mentor: Omit<Prisma.MentorCreateInput, "user">
) => {
  try {
    const createdMentor = await prisma.mentor.create({
      data: {
        user: {
          connectOrCreate: { where: { email: user.email }, create: user },
        },
        ...mentor,
      },
    });
    return createdMentor;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError("Mentor is not unique", HttpStatusCode.BAD_REQUEST);
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

export interface IMentorCreateMany {
  user: Prisma.UserCreateInput;
  mentor: Omit<Prisma.MentorCreateInput, "user">;
}

/**
 * @function createManyMentor Create many Mentor records with associated User records
 * @param data The array of data to create the Mentor Records with
 * @returns The array of mentor objects created
 */
export const createManyMentors = async (data: IMentorCreateMany[]) => {
  try {
    const createdMentors = await Promise.all(
      data.map(async (userData) => {
        return await prisma.mentor.create({
          data: { user: { create: userData.user }, ...userData.mentor },
        });
      })
    );
    return createdMentors;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        `Mentor ${e.meta} is not unique`,
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
