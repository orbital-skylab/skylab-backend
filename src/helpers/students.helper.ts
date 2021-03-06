/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Student, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneStudent,
  deleteUniqueStudent,
  findManyStudentsWithUserData,
  findUniqueStudentWithUserData,
  updateUniqueStudent,
} from "src/models/students.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { generateRandomPassword, hashPassword } from "./authentication.helper";
import {
  isValidEmail,
  isValidMatriculationNumber,
  isValidNusnetId,
  removePasswordFromUser,
} from "./users.helper";
import { prismaMinimal as prisma } from "../client";

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

export async function getOneStudentByNusnetId(nusnetId: string) {
  const student = await findUniqueStudentWithUserData({
    where: { nusnetId: nusnetId },
  });
  return student;
}

export async function createUserWithStudentRole(body: any, isDev?: boolean) {
  const { student, user } = body;

  if (!isValidEmail(user.email)) {
    throw new SkylabError("Email is invalid", HttpStatusCode.BAD_REQUEST);
  }
  if (!isValidMatriculationNumber(student.matricNo)) {
    throw new SkylabError(
      "Matriculation Number is invalid",
      HttpStatusCode.BAD_REQUEST
    );
  }
  if (!isValidNusnetId(student.nusnetId)) {
    throw new SkylabError("NUSNET ID is invalid", HttpStatusCode.BAD_REQUEST);
  }

  user.password =
    isDev && user.password
      ? await hashPassword(user.password)
      : await generateRandomPassword();

  const { cohortYear, projectId, ...studentData } = student;
  const [createdUser, createdStudent] = await prisma.$transaction([
    prisma.user.create({ data: user }),
    prisma.student.create({
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
      student.user.password =
        isDev && student.user.password
          ? await hashPassword(student.user.password)
          : await generateRandomPassword();

      accounts.push({ project: projectData, student });
    }
  }

  const createAccountAttempts = await Promise.allSettled(
    accounts.map(async (account) => {
      const { project, student: _student } = account;
      const { user, student } = _student;
      if (!isValidEmail(user.email)) {
        throw new SkylabError("Email is invalid", HttpStatusCode.BAD_REQUEST);
      }
      if (!isValidMatriculationNumber(student.matricNo)) {
        throw new SkylabError(
          "Matriculation Number is invalid",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (!isValidNusnetId(student.nusnetId)) {
        throw new SkylabError(
          "NUSNET ID is invalid",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const { cohortYear, ...studentData } = student;
      const [createdUser, createdStudent] = await prisma.$transaction([
        prisma.user.create({ data: user }),
        prisma.student.create({
          data: {
            ...studentData,
            user: { connect: { email: user.email } },
            cohort: { connect: { academicYear: cohortYear } },
            project: {
              connectOrCreate: {
                where: {
                  name_cohortYear: {
                    name: project.name,
                    cohortYear: cohortYear,
                  },
                },
                create: project,
              },
            },
          },
        }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return {
        user: removePasswordFromUser(createdUser),
        student: createdStudent,
      };
    })
  );
  return createAccountAttempts
    .map((attempt, index) => {
      if (attempt.status === "rejected") {
        return `- Row ${index + 1}: ${attempt.reason.message}`;
      }
    })
    .filter((error) => error)
    .join("\n");
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

export async function deleteOneStudentByStudentId(studentId: number) {
  const deletedStudent = await deleteUniqueStudent({
    where: { id: studentId },
  });
  return deletedStudent;
}
