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
import { SkylabError } from "../errors/SkylabError";
import { findUniqueAdviserWithUserData } from "../models/advisers.db";
import {
  createOneProject,
  deleteOneProject,
  findManyProjects,
  findManyProjectsWithUserData,
  findUniqueProject,
  findUniqueProjectWithUserData,
  updateOneProject,
  countProjects,
} from "../models/projects.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
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

export async function editProjectDataByProjectID(projectId: number, body: any) {
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

  const projects = await findManyProjectsWithUserData({
    where: {
      students: studentId ? { some: { id: Number(studentId) } } : undefined,
      adviserId: adviserId ? Number(adviserId) : undefined,
      mentorId: mentorId ? Number(mentorId) : undefined,
    },
  });

  return projects.map((project) => parseGetProjectInput(project));
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

export async function getAdviserUserByProjectID(projectId: number) {
  const project = await findUniqueProject({ where: { id: projectId } });
  if (!project.adviserId) {
    throw new SkylabError(
      "This project is not assigned an adviser",
      HttpStatusCode.BAD_REQUEST
    );
  }
  const adviser = await findUniqueAdviserWithUserData({
    where: { id: project.adviserId },
  });
  return adviser;
}

/**
 * Achievement level ranking: Artemis (highest) > Apollo > Gemini > Vostok (lowest)
 */
const ACHIEVEMENT_RANK: Record<AchievementLevel, number> = {
  Artemis: 1,
  Apollo: 2,
  Gemini: 3,
  Vostok: 4,
};

export interface GetPublicProjectsParams {
  page?: number;
  limit?: number;
}

export interface PaginatedProjects {
  projects: ReturnType<typeof parseGetProjectInput>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetch public projects for static site generation
 * Supports pagination and returns projects sorted by cohort year (desc) then achievement level
 */
export async function getPublicProjects(
  params: GetPublicProjectsParams = {}
): Promise<PaginatedProjects> {
  const { page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where = { hasDropped: false };

  const [projectsRaw, total] = await Promise.all([
    findManyProjectsWithUserData({
      where,
      orderBy: [{ cohortYear: "desc" }, { id: "desc" }],
    }),
    countProjects(where),
  ]);

  // Sort by cohort year (desc), then by achievement level rank
  const sortedProjects = projectsRaw.sort((a, b) => {
    // First by cohort year descending
    if (b.cohortYear !== a.cohortYear) {
      return b.cohortYear - a.cohortYear;
    }
    // Then by achievement level (Artemis first)
    const rankA = a.achievement ? ACHIEVEMENT_RANK[a.achievement] : 999;
    const rankB = b.achievement ? ACHIEVEMENT_RANK[b.achievement] : 999;
    return rankA - rankB;
  });

  // Apply pagination after sorting
  const paginatedProjects = sortedProjects.slice(skip, skip + limit);

  return {
    projects: paginatedProjects.map((project) => parseGetProjectInput(project)),
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
}
