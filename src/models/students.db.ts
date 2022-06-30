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

export const createOneStudent = async (student: Prisma.StudentCreateArgs) => {
  try {
    return await prisma.student.create(student);
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

export const createManyStudent = async (
  students: Prisma.StudentCreateManyArgs
) => {
  try {
    return await prisma.student.createMany(students);
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

export const updateStudent = async (student: Prisma.StudentUpdateArgs) => {
  try {
    return await prisma.student.update(student);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
};
