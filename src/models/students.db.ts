import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstStudent Find the first student record with the given query conditions
 * @param query The query conditions for the user
 * @returns The first student record that matches the query conditions
 */
export const getFirstStudent = async ({
  include,
  ...query
}: Prisma.StudentFindFirstArgs) => {
  const student = await prisma.student.findFirst({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!student) {
    throw new SkylabError("Student was not found", HttpStatusCode.NOT_FOUND);
  }

  return student;
};

/**
 * @function getOneStudent Find a unique student recod with the given query conditions
 * @param query The query conditions for the user
 * @returns The student record that matches the query conditions
 */
export const getOneStudent = async ({
  include,
  ...query
}: Prisma.StudentFindUniqueArgs) => {
  const student = await prisma.student.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!student) {
    throw new SkylabError("Student was not found", HttpStatusCode.NOT_FOUND);
  }

  return student;
};

/**
 * @function getManyStudents Find all the students that match the given query condition
 * @param query The query conditions to be selected upon
 * @returns The array of student records that match the query conditions
 */
export const getManyStudents = async ({
  include,
  ...query
}: Prisma.StudentFindManyArgs) => {
  const students = await prisma.student.findMany({
    include: { ...include, user: true },
    ...query,
  });

  return students;
};

/**
 * @function createStudent Create a student with an associated User Record
 * @param user The information to create the User Record
 * @param student The information to creat the Student Record
 * @returns The student object that was created
 */
export const createStudent = async (
  user: Prisma.UserCreateInput,
  student: Omit<Prisma.StudentCreateInput, "user">
) => {
  try {
    const createdStudent = await prisma.student.create({
      data: { user: { create: user }, ...student },
    });
    console.log(createdStudent);
    return createdStudent;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Student is not unique",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(
      e.message +
        `\n user: ${JSON.stringify(user)} \n student: ${JSON.stringify(
          student
        )}`,
      HttpStatusCode.BAD_REQUEST
    );
  }
};

export interface IStudentCreateMany {
  user: Prisma.UserCreateInput;
  student: Omit<Prisma.StudentCreateInput, "user">;
}

/**
 * @function createManyStudents Create many Students with associated User Records simultaenously
 * @param data The array of data to create the Student Records with
 * @returns The array of student objects created
 */
export const createManyStudents = async (data: IStudentCreateMany[]) => {
  try {
    const createdStudents = await Promise.all(
      data.map(async (userData) => {
        return await prisma.student.create({
          data: { user: { create: userData.user }, ...userData.student },
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
        `Student ${e.meta} is not unique`,
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
