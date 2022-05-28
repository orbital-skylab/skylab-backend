import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

export const getStudentByEmail = async (email: string) => {
  const studentWithEmail = await prisma.user.findUnique({
    where: { email: email },
    include: { Student: true },
    rejectOnNotFound: false,
  });
  if (!studentWithEmail) {
    throw new SkylabError(
      "User with given email was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }
  return studentWithEmail;
};

/**
 * @function getAllStudents Return all students in the database
 * @returns All Student Records in the database
 */
export const getAllStudents = async () => {
  const allStudents = await prisma.student.findMany({
    include: { user: true },
  });
  return allStudents;
};

export const createStudentUser = async (user: Prisma.UserCreateInput) => {
  try {
    const newUser = await prisma.user.create({
      data: { ...user, Student: { create: {} } },
    });
    return newUser;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError("User is not unique", HttpStatusCode.BAD_REQUEST);
    }
  }
};

/**
 * @function createManyStudentUsers Function to create student users in the database
 * @param users Array of users to create student accounts for
 * @returns The users that were created
 */
export const createManyStudentUsers = async (
  users: Prisma.UserCreateInput[]
) => {
  try {
    const createdStudents = await Promise.all(
      users.map(async (user) => {
        return await prisma.user.create({
          data: { ...user, Student: { create: {} } },
        });
      })
    );
    return createdStudents;
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
