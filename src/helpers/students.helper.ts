/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, PrismaClient, Student, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneStudent,
  getManyStudents,
  getOneStudent,
  updateStudent,
} from "src/models/students.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { generateRandomHashedPassword, hashPassword } from "./users.helper";

const prismaClient = new PrismaClient();

/**
 * @function getStudentInputParser Parse the input returned from the `  `.student.find function
 * @param student The payload returned from prisma.student.find
 * @returns Flattened object with both User and Student Data
 */
export const parseGetStudentsInput = (
  student: Prisma.StudentGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = student;
  return { ...user, ...data, studentId: id };
};

export const parseGetStudentsFilter = (
  query: any
): Prisma.StudentFindManyArgs => {
  return {
    take: query.limit ?? undefined,
    skip: query.page * query.limit ?? undefined,
    where: query.cohortYear ?? { cohortYear: query.cohortYear },
  };
};

/**
 * @function getFilteredStudents Retrieve a list of students that match the given query conditions
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Student Records that match the given query
 */
export const getFilteredStudents = async (query: any) => {
  const filteredQuery = parseGetStudentsFilter(query);
  const students = await getManyStudents(filteredQuery);
  const parsedStudents = students.map((student) =>
    parseGetStudentsInput(student)
  );
  return parsedStudents;
};

export const getStudentById = async (studentId: number) => {
  const student = await getOneStudent({ where: { id: studentId } });
  return parseGetStudentsInput(student);
};

export const createNewStudentParser = async (
  body: any,
  isDev: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  student: Prisma.StudentCreateInput & { cohortYear: number };
  projectId?: number;
}> => {
  const { student, user, projectId } = body;
  if (isDev && !user.password) {
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
    projectId: projectId ? projectId : undefined,
  };
};

export const createNewStudent = async (body: any, isDev?: boolean) => {
  const account = await createNewStudentParser(body, isDev ?? false);
  const { user, student, projectId } = account;
  const { cohortYear, ...studentData } = student;

  const [createdUser, createdStudent] = await prismaClient.$transaction([
    prismaClient.user.create({ data: user }),
    prismaClient.student.create({
      data: {
        ...studentData,
        user: { connect: { email: user.email } },
        cohort: { connect: { academicYear: cohortYear } },
        project: projectId ? { connect: { id: projectId } } : undefined,
      },
    }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...createdUserWithoutPassword } = createdUser;
  return {
    ...createdUserWithoutPassword,
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

  const createdAccounts: Array<
    Omit<User, "password"> & {
      student: Student & { cohortYear: number };
    }
  > = [];
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
      ...createdUserWithoutPassword,
      student: createdStudent,
    });
  }

  return createdAccounts;
};

export const addStudentToAccountParser = (
  body: any
): Prisma.StudentCreateInput & {
  cohortYear: number;
  projectId: number | undefined;
} => {
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
  const { cohortYear, projectId, ...studentData } = student;
  return await createOneStudent({
    data: {
      ...studentData,
      cohort: { connect: { academicYear: cohortYear } },
      user: { connect: { id: Number(userId) } },
      project: projectId ? { connect: { id: projectId } } : undefined,
    },
  });
};

export const parseEditStudent = (body: any): Prisma.StudentUpdateInput => {
  const { student } = body;
  return {
    matricNo: student.matricNo ?? undefined,
    nusnetId: student.nusnetId ?? undefined,
  };
};

export const editStudent = async (studentId: number, body: any) => {
  const studentData = parseEditStudent(body);
  return await updateStudent({ where: { id: studentId }, data: studentData });
};
