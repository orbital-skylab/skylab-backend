import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getMentorByEmail Get mentor record with a particularly email
 * @param email The email of the mentor to be retrieved
 * @returns The mentor with the given email
 */
export const getMentorByEmail = async (email: string) => {
  const mentorWithEmail = await prisma.user.findUnique({
    where: { email: email },
    include: { Mentor: true },
    rejectOnNotFound: false,
  });

  if (!mentorWithEmail) {
    throw new SkylabError(
      "User with given email was not found",
      HttpStatusCode.NOT_FOUND
    );
  }

  return mentorWithEmail;
};

/**
 * @function getAllMentors Return all mentors in the database
 * @returns All Mentor Records in the database
 */
export const getAllMentors = async () => {
  const allMentors = await prisma.user.findMany({
    where: { Mentor: { isNot: null } },
    include: { Mentor: true },
  });

  return allMentors;
};

/**
 * @function createMentorUser Create User with associated Mentor Record in the database
 * @param user Information of user to be created
 * @returns
 */
export const createMentorUser = async (user: Prisma.UserCreateInput) => {
  try {
    const newUser = await prisma.user.create({
      data: { ...user, Mentor: { create: {} } },
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
 * @function createManyMentorUsers Function to create mentor users in the database
 * @param users Array of users to create mentor accounts for
 * @returns The users that were created
 */
export const createManyMentorUsers = async (
  users: Prisma.UserCreateInput[]
) => {
  try {
    const createdMentors = await Promise.all(
      users.map(async (user) => {
        return await prisma.user.create({
          data: { ...user, Mentor: { create: {} } },
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
        `User with information: ${e.meta} is not unique`,
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
