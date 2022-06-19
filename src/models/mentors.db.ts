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

export const createOneMentor = async (mentor: Prisma.MentorCreateArgs) => {
  try {
    return await prisma.mentor.create(mentor);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Student is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const createManyMentors = async (
  mentors: Prisma.MentorCreateManyArgs
) => {
  try {
    return await prisma.student.createMany(mentors);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "One of the students are not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }
  }
};
