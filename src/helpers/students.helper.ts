/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Student, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneStudent,
  getManyStudents,
  getOneStudent,
} from "src/models/students.db";
import { createManyUsers, createOneUser } from "src/models/users.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { generateRandomHashedPassword, hashPassword } from "./users.helper";

/**
 * @function getStudentInputParser Parse the input returned from the prisma.student.find function
 * @param student The payload returned from prisma.student.find
 * @returns Flattened object with both User and Student Data
 */
export const getStudentInputParser = (
  student: Prisma.StudentGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = student;
  return { ...user, ...data, studentId: id };
};

export const getStudentsFilterParser = (query: any) => {
  let filter: Prisma.StudentFindManyArgs = {};
  if ((query.page && !query.limit) || (query.limit && !query.page)) {
    throw new SkylabError(
      `${
        query.limit ? "Page" : "Limit"
      } parameter missing in a pagination query`,
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (query.page && query.limit) {
    filter = {
      ...filter,
      take: Number(query.limit),
      skip: Number(query.page) * Number(query.limit),
    };
  }

  if (query.cohortYear) {
    filter = { ...filter, where: { cohortYear: Number(query.cohortYear) } };
  }

  return filter;
};

/**
 * @function getFilteredStudents Retrieve a list of students that match the given query conditions
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Student Records that match the given query
 */
export const getFilteredStudents = async (query: any) => {
  const filteredQuery = getStudentsFilterParser(query);
  const students = await getManyStudents(filteredQuery);
  const parsedStudents = students.map((student) =>
    getStudentInputParser(student)
  );
  return parsedStudents;
};

export const getStudentById = async (studentId: string) => {
  const student = await getOneStudent({ where: { id: Number(studentId) } });
  return getStudentInputParser(student);
};

export const createNewStudentParser = async (
  body: any,
  isAdmin: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  student: Prisma.StudentCreateInput;
}> => {
  const { student, user } = body;
  if (!student || !user || (isAdmin && !user.password)) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password = user.password
    ? await hashPassword(user.password)
    : await generateRandomHashedPassword();

  return {
    user,
    student,
  };
};

export const createNewStudent = async (body: any, isAdmin?: boolean) => {
  const account = await createNewStudentParser(body, isAdmin ?? false);
  return await createOneUser({
    data: { ...account.user, student: { create: account.student } },
  });
};

export const createManyStudentsParser = async (
  body: any,
  isAdmin: boolean
): Promise<
  {
    user: Prisma.UserCreateInput;
    student: Prisma.StudentCreateInput;
  }[]
> => {
  const { count, accounts } = body;

  if (!count || !accounts) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }
  if (count !== accounts.length) {
    throw new SkylabError(
      "Count and Accounts Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const promises: Promise<string>[] = [];
  accounts.forEach((account: { student: Student; user: User }) => {
    const { user } = account;

    if (isAdmin && !user.password) {
      throw new SkylabError(
        "All accounts should have a password input",
        HttpStatusCode.BAD_REQUEST
      );
    }

    promises.push(
      user.password
        ? hashPassword(user.password)
        : generateRandomHashedPassword()
    );
  });

  await Promise.all(promises);
  return accounts;
};

export const createManyStudents = async (body: any, isAdmin?: boolean) => {
  const accounts = await createManyStudentsParser(body, isAdmin ?? false);
  return await createManyUsers({
    data: accounts.map((account) => {
      return {
        ...account.user,
        student: { create: account.student },
      };
    }),
  });
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
