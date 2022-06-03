import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { ICreateStudentUser } from "src/helpers/students.helper";

const prisma = new PrismaClient();

/**
 * @function getStudentByEmail Get student record with a particular email
 * @param email The email of the student to be retrieved
 * @returns The student with the given email
 */
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
  const allStudents = await prisma.user.findMany({
    where: { Student: { isNot: null } },
    include: { Student: true },
  });
  return allStudents;
};

/**
 * @function createStudentUser Create User with associated Student Record in the database
 * @param userInfo Information of user to be created
 * @returns
 */
export const createStudentUser = async (userInfo: ICreateStudentUser) => {
  try {
    const { student, user } = userInfo;
    const newUser = await prisma.user.create({
      data: { ...user, Student: { create: { ...student } } },
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
 * @function createManyStudentUsers Function to create student users in the database
 * @param usersInfo Array of users to create student accounts for
 * @returns The users that were created
 */
export const createManyStudentUsers = async (
  usersInfo: ICreateStudentUser[]
) => {
  try {
    const createdStudents = await Promise.all(
      usersInfo.map(async (userInfo) => {
        const { user, student } = userInfo;
        return await prisma.user.create({
          data: { ...user, Student: { create: { ...student } } },
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
