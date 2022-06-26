/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, PrismaClient, Student, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneStudent,
  getManyStudents,
  getOneStudent,
} from "src/models/students.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  generateRandomHashedPassword,
  hashPassword,
  sendPasswordResetEmail,
} from "./users.helper";

const prismaClient = new PrismaClient();

/**
 * @function getStudentInputParser Parse the input returned from the `  `.student.find function
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
  isDev: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  student: Prisma.StudentCreateInput & { cohortYear: number };
}> => {
  const { student, user } = body;
  if (!student || !user || (isDev && !user.password)) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password =
    isDev && user.password
      ? await hashPassword(user.password)
      : await generateRandomHashedPassword();

  return {
    user,
    student,
  };
};

export const createNewStudent = async (body: any, isDev?: boolean) => {
  const account = await createNewStudentParser(body, isDev ?? false);
  const { user, student } = account;
  const { cohortYear, ...studentData } = student;

  const [createdUser, createdStudent] = await prismaClient.$transaction([
    prismaClient.user.create({ data: user }),
    prismaClient.student.create({
      data: {
        ...studentData,
        user: { connect: { email: user.email } },
        cohort: { connect: { academicYear: cohortYear } },
      },
    }),
  ]);
  if (!isDev) {
    await sendPasswordResetEmail([createdUser.email]);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...createdUserWithoutPassword } = createdUser;
  return {
    user: createdUserWithoutPassword,
    student: createdStudent,
  };
};

export const createManyStudentsParser = async (
  body: any,
  isDev: boolean
): Promise<
  {
    project: Prisma.ProjectCreateInput;
    student: {
      user: Prisma.UserCreateInput;
      student: Prisma.StudentCreateInput & { cohortYear: number };
    };
  }[]
> => {
  const { count, projects } = body;

  if (!count || !projects) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }
  if (count !== projects.length) {
    throw new SkylabError(
      "Count and Projects Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const accounts = [];
  for (const project of projects) {
    const { students, ...projectData } = project;
    for (const student of students) {
      if (projectData.cohortYear !== student.student.cohortYear) {
        console.log(projectData, student.student.cohortYear);
        throw new SkylabError(
          "Project cohort and student cohort does not match",
          HttpStatusCode.BAD_REQUEST
        );
      }

      if (isDev && !student.user.password) {
        throw new SkylabError(
          "All accounts should have a password input",
          HttpStatusCode.BAD_REQUEST
        );
      }

      student.user.password =
        isDev && student.user.password
          ? await hashPassword(student.user.password)
          : await generateRandomHashedPassword();

      accounts.push({ project: projectData, student });
    }
  }

  return accounts;
};

export const createManyStudents = async (body: any, isDev?: boolean) => {
  const accounts = await createManyStudentsParser(body, isDev ?? false);

  const createdAccounts: Array<{
    user: Omit<User, "password">;
    student: Student & { cohortYear: number };
  }> = [];
  for (const account of accounts) {
    const { project, student: _student } = account;
    const { user, student } = _student;
    const { cohortYear, ...studentData } = student;
    const [createdUser, createdStudent] = await prismaClient.$transaction([
      prismaClient.user.create({ data: user }),
      prismaClient.student.create({
        data: {
          ...studentData,
          user: { connect: { email: user.email } },
          cohort: { connect: { academicYear: cohortYear } },
          project: {
            connectOrCreate: {
              where: {
                name_cohortYear: { name: project.name, cohortYear: cohortYear },
              },
              create: project,
            },
          },
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...createdUserWithoutPassword } = createdUser;
    createdAccounts.push({
      user: createdUserWithoutPassword,
      student: createdStudent,
    });
  }

  if (!isDev) {
    const mailingList = createdAccounts.map((account) => account.user.email);
    await sendPasswordResetEmail(mailingList);
  }
  return createdAccounts;
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
