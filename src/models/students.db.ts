import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { prisma } from "../client";

export async function findFirstStudentWithUserData({
  include,
  ...query
}: Prisma.StudentFindFirstArgs) {
  const firstStudent = await prisma.student.findFirst({
    ...query,
    include: { ...include, user: true },
    rejectOnNotFound: false,
  });
  if (!firstStudent) {
    throw new SkylabError("Student was not found", HttpStatusCode.BAD_REQUEST);
  }
  return firstStudent;
}

export async function findUniqueStudent(query: Prisma.StudentFindUniqueArgs) {
  const uniqueStudent = await prisma.student.findUnique({
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueStudent) {
    throw new SkylabError("Student was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueStudent;
}

export async function findUniqueStudentWithUserData({
  include,
  ...query
}: Prisma.StudentFindUniqueArgs) {
  const uniqueStudent = await prisma.student.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueStudent) {
    throw new SkylabError("Student was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueStudent;
}

export async function findUniqueStudentWithProjectData({
  include,
  ...query
}: Prisma.StudentFindUniqueArgs) {
  const uniqueStudent = await prisma.student.findUnique({
    include: { ...include, project: true },
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueStudent) {
    throw new SkylabError("Student was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueStudent;
}

export async function findUniqueStudentWithProjectWithAdviserData({
  include,
  ...query
}: Prisma.StudentFindUniqueArgs) {
  const uniqueStudent = await prisma.student.findUnique({
    ...query,
    include: { ...include, project: { include: { adviser: true } } },
  });
  if (!uniqueStudent) {
    throw new SkylabError("Student was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueStudent;
}

export async function findManyStudentsWithUserData({
  include,
  ...query
}: Prisma.StudentFindManyArgs) {
  const manyStudents = await prisma.student.findMany({
    include: { ...include, user: true },
    ...query,
  });
  return manyStudents;
}

export async function createOneStudent(student: Prisma.StudentCreateArgs) {
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
}

export async function createManyStudents(
  students: Prisma.StudentCreateManyArgs
) {
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
}

export async function updateUniqueStudent(student: Prisma.StudentUpdateArgs) {
  try {
    return await prisma.student.update(student);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}

export async function deleteUniqueStudent(query: Prisma.StudentDeleteArgs) {
  try {
    return await prisma.student.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}
