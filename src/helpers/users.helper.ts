/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { createOneStudent } from "src/models/students.db";
import { createManyUsers, createOneUser } from "src/models/users.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export const createNewStudentParser = (
  body: any
): {
  user: Prisma.UserCreateInput;
  student: Prisma.StudentCreateInput;
} => {
  if (!body.student || !body.user) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  return {
    user: body.user,
    student: body.student,
  };
};

export const createNewStudent = async (body: any) => {
  const account = createNewStudentParser(body);
  const prismaArg: Prisma.UserCreateArgs = {
    data: { ...account.user, student: { create: account.student } },
  };
  return await createOneUser(prismaArg);
};

export const createManyStudentsParser = (
  body: any
): {
  user: Prisma.UserCreateInput;
  student: Prisma.StudentCreateInput;
}[] => {
  if (!body.count || !body.accounts) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  const { count, accounts } = body;

  if (count !== accounts.length) {
    throw new SkylabError(
      "Count and Accounts Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return accounts;
};

export const createManyStudents = async (body: any) => {
  const accounts = createManyStudentsParser(body);
  const prismaArgsArray: Prisma.UserCreateArgs[] = accounts.map((account) => {
    return {
      data: { ...account.user, student: { create: account.student } },
    };
  });
  return await createManyUsers(prismaArgsArray);
};

export const addStudentToAccountParser = (
  body: any
): Prisma.StudentCreateInput & { cohortYear: number } => {
  if (!body.student) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  return body.student;
};

export const addStudentToAccount = async (userId: string, body: any) => {
  const student = addStudentToAccountParser(body);
  const { cohortYear, ...studentData } = student;
  return await createOneStudent({
    data: {
      ...studentData,
      cohort: { connect: { academicYear: cohortYear } },
      user: { connect: { id: Number(userId) } },
    },
  });
};
