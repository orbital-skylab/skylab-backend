/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Student, User } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import {
  createOneStudent,
  deleteUniqueStudent,
  findManyStudentsWithUserData,
  findUniqueStudentWithUserData,
  updateUniqueStudent,
} from "../models/students.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
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

type BatchAddProject = Omit<Prisma.ProjectCreateInput, "cohort"> & {
  cohortYear: number;
};
type BatchAddStudent = Omit<
  Prisma.StudentCreateInput,
  "cohort" | "project" | "user"
> & { cohortYear: number };

export async function createManyUsersWithStudentRole(
  body: {
    count: number;
    projects: Array<
      BatchAddProject & {
        students: Array<{
          student: BatchAddStudent;
          user: Omit<Prisma.UserUncheckedCreateInput, "password"> & {
            password?: string;
          };
        }>;
      }
    >;
  },
  isDev?: boolean
) {
  const { count, projects } = body;

  if (count != projects.length) {
    throw new SkylabError(
      "Count and Projects Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const accounts: Array<{
    project: BatchAddProject;
    student: {
      student: BatchAddStudent;
      user: Prisma.UserCreateInput;
    };
  }> = [];
  for (const project of projects) {
    const { students, ...projectData } = project;
    for (const student of students) {
      const password =
        isDev && student.user.password
          ? await hashPassword(student.user.password)
          : await generateRandomPassword();

      accounts.push({
        project: projectData,
        student: {
          student: student.student,
          user: { ...student.user, password },
        },
      });
    }
  }

  const createAccountErrors: { rowNumber: number; message: string }[] = [];

  let rowNumber = 1;
  for (const account of accounts) {
    try {
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
      const { cohortYear: _cohortYear, ...projectData } = project;
      await prisma.$transaction([
        prisma.user.create({ data: user }),
        prisma.student.create({
          data: {
            ...studentData,
            user: { connect: { email: user.email } },
            cohort: { connect: { academicYear: cohortYear } },
            project: {
              connectOrCreate: {
                where: {
                  teamName_cohortYear: {
                    teamName: project.teamName,
                    cohortYear: cohortYear,
                  },
                },
                create: {
                  ...projectData,
                  cohort: {
                    connect: {
                      academicYear: _cohortYear,
                    },
                  },
                },
              },
            },
          },
        }),
      ]);
    } catch (e) {
      createAccountErrors.push({ rowNumber, message: e.message || e });
    }
    rowNumber++;
  }

  return createAccountErrors
    .map((error) => `- Row ${error.rowNumber}: ${error.message}`)
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
