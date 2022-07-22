/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AchievementLevel,
  Adviser,
  Mentor,
  Prisma,
  Project,
  Student,
  User,
} from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { findUniqueAdviser } from "src/models/advisers.db";
import { findUniqueMentor } from "src/models/mentors.db";
import {
  createOneProject,
  deleteOneProject,
  findManyProjects,
  findManyProjectsWithUserData,
  findUniqueProjectWithUserData,
  updateOneProject,
} from "src/models/projects.db";
import { findUniqueStudent } from "src/models/students.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { removePasswordFromUser } from "./users.helper";

export function parseGetProjectInput(
  project: Project & {
    students: (Student & {
      user: User;
    })[];
    mentor:
      | (Mentor & {
          user: User;
        })
      | null;
    adviser:
      | (Adviser & {
          user: User;
        })
      | null;
  }
) {
  const { mentor, students, adviser, ...projectData } = project;
  return {
    ...projectData,
    mentor: mentor ? parseMentorInProject(mentor) : undefined,
    students: students.map((student) => parseStudentInProject(student)),
    adviser: adviser ? parseAdviserInProject(adviser) : undefined,
  };
}

export function parseStudentInProject(student: Student & { user: User }) {
  const { user, ...studentData } = student;
  const userWithoutPassword = removePasswordFromUser(user);
  const { id, ...studentInfo } = studentData;
  return { studentId: id, ...userWithoutPassword, ...studentInfo };
}
export function parseAdviserInProject(adviser: Adviser & { user: User }) {
  const { user, ...adviserData } = adviser;
  const userWithoutPassword = removePasswordFromUser(user);
  const { id, ...adviserInfo } = adviserData;
  return { adviserId: id, ...userWithoutPassword, ...adviserInfo };
}
export function parseMentorInProject(mentor: Mentor & { user: User }) {
  const { user, ...mentorData } = mentor;
  const userWithoutPassword = removePasswordFromUser(user);
  const { id, ...mentorInfo } = mentorData;
  return { mentorId: id, ...userWithoutPassword, ...mentorInfo };
}

export async function getManyProjectsWithFilter(
  query: any & {
    limit?: number;
    page?: number;
    achievement?: AchievementLevel;
    cohortYear?: number;
    search?: string;
    dropped?: boolean;
  }
) {
  const { limit, page, achievement, cohortYear, search, dropped } = query;

  const projectQuery: Prisma.ProjectFindManyArgs = {
    take: limit ? Number(limit) : undefined,
    skip: limit && page ? Number(limit) * Number(page) : undefined,
    where: {
      achievement: achievement ?? undefined,
      hasDropped: dropped ? (dropped == "true" ? true : false) : undefined,
      cohortYear: cohortYear ? Number(cohortYear) : undefined,
      OR: search
        ? [
            { name: { search: search } },
            { students: { some: { user: { name: { search: search } } } } },
            { mentor: { user: { name: { search: search } } } },
            { adviser: { user: { name: { search: search } } } },
          ]
        : undefined,
    },
    orderBy: { id: "asc" },
  };

  const projects = await findManyProjectsWithUserData(projectQuery);
  const parsedProjects = projects.map((project) =>
    parseGetProjectInput(project)
  );
  return parsedProjects;
}

export async function getOneProjectById(projectId: number) {
  const projectWithId = await findUniqueProjectWithUserData({
    where: { id: Number(projectId) },
  });
  return parseGetProjectInput(projectWithId);
}

export async function getManyProjectsLean(
  cohortYear: number,
  hasDropped?: boolean
) {
  const leanProjects = await findManyProjects({
    where: {
      cohortYear: cohortYear,
      hasDropped: hasDropped,
    },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
  return leanProjects;
}

export async function createProject(body: any) {
  const { project } = body;
  const { cohortYear, students, adviser, mentor, ...projectInfo } = project;

  /* Parse Request Body */
  const createProjectArgs: Prisma.ProjectCreateArgs = {
    data: {
      ...projectInfo,
      cohort: { connect: { academicYear: cohortYear } },
      adviser: adviser ? { connect: { id: adviser } } : undefined,
      mentor: mentor ? { connect: { id: mentor } } : undefined,
      students: students
        ? {
            connect: students.map((student: number) => {
              return { id: student };
            }),
          }
        : undefined,
    },
  };

  return await createOneProject(createProjectArgs);
}

interface IEditProjectData {
  name?: string;
  achievement?: AchievementLevel;
  proposalPdf?: string;
  students?: number[];
  adviser?: number;
  mentor?: number;
}

export async function editProjectDataByProjectID(
  projectId: number,
  body: any & IEditProjectData
) {
  const { students, adviser, mentor, ...projectUpdates } = body;
  return await updateOneProject({
    where: { id: projectId },
    data: {
      ...projectUpdates,
      students: students
        ? {
            connect: students.map((student: number) => {
              return { id: student };
            }),
          }
        : undefined,
      adviser: adviser ? { connect: { id: adviser } } : undefined,
      mentor: mentor ? { connect: { id: mentor } } : undefined,
    },
  });
}

export async function getProjectsViaRoleIds(
  query: any & {
    studentId?: number;
    adviserId?: number;
    mentorId?: number;
  }
) {
  const { studentId, adviserId, mentorId } = query;

  if (studentId) {
    return await findUniqueStudent({
      where: { id: Number(studentId) },
      select: {
        project: { include: { students: true, mentor: true, adviser: true } },
      },
    });
  } else if (adviserId) {
    return await findUniqueAdviser({
      where: { id: Number(adviserId) },
      select: {
        projects: { include: { students: true, mentor: true, adviser: true } },
      },
    });
  } else if (mentorId) {
    return await findUniqueMentor({
      where: { id: Number(mentorId) },
      select: {
        projects: { include: { students: true, mentor: true, adviser: true } },
      },
    });
  }

  throw new SkylabError(
    "Internal server error occurred",
    HttpStatusCode.INTERNAL_SERVER_ERROR
  );
}

export async function deleteOneProjectById(projectId: number) {
  return await deleteOneProject({ where: { id: projectId } });
}

export async function getProjectIDsByAdviserID(adviserId: number) {
  return await findManyProjects({
    where: { adviserId: adviserId },
    select: { id: true },
  });
}
