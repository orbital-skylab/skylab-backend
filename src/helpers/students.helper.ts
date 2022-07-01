/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, PrismaClient, Student, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneStudent,
  findManyStudentsWithUserData,
  findUniqueStudentWithUserData,
  updateUniqueStudent,
} from "src/models/students.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { generateRandomPassword, hashPassword } from "./authentication.helper";
import { removePasswordFromUser } from "./users.helper";

const prismaClient = new PrismaClient();

export function parseGetStudentInput(student: Student & { user: User }) {
  const { user, id, ...data } = student;
  const userWithoutPassword = removePasswordFromUser(user);
  return { ...userWithoutPassword, ...data, studentId: id };
}

export async function getManyStudentsWithFilter(
  query: any & {
    limit?: number;
    page?: number;
    cohortYear?: number;
  }
) {
  const { limit, page, cohortYear } = query;
  /* Create Filter Object */
  const studentQuery: Prisma.StudentFindManyArgs = {
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
    where: cohortYear
      ? {
          cohortYear: cohortYear,
        }
      : undefined,
  };

  /* Fetch Students with Filter Object */
  const students = await findManyStudentsWithUserData(studentQuery);

  /* Parse Students Objects */
  const parsedStudents = students.map((student) =>
    parseGetStudentInput(student)
  );

  return parsedStudents;
}

export async function getOneStudentById(studentId: number) {
  const student = await findUniqueStudentWithUserData({
    where: { id: studentId },
  });
  return parseGetStudentInput(student);
}

export async function createUserWithStudentRole(body: any, isDev?: boolean) {
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
      : await generateRandomPassword();

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
  return {
    user: removePasswordFromUser(createdUser),
    student: createdStudent,
  };
}

export async function createManyUsersWithStudentRole(
  body: any,
  isDev?: boolean
) {
  const { count, projects } = body;

  if (count != projects.length) {
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
          : await generateRandomPassword();

      accounts.push({ project: projectData, student });
    }
  }

  const createdAccounts = [];
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
    createdAccounts.push({
      user: removePasswordFromUser(createdUser),
      student: createdStudent,
    });
  }

  return createdAccounts;
}

export async function addStudentRoleToUser(userId: string, body: any) {
  const { student } = body;
  const { cohortYear, projectId, ...studentData } = student;
  return await createOneStudent({
    data: {
      ...studentData,
      cohort: { connect: { academicYear: cohortYear } },
      user: { connect: { id: Number(userId) } },
      project: projectId ? { connect: { id: projectId } } : undefined,
    },
  });
}

export async function editStudentDataByStudentID(studentId: number, body: any) {
  const { student } = body;
  return await updateUniqueStudent({
    where: { id: studentId },
    data: student,
  });
}
