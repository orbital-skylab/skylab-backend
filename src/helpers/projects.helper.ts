/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AchievementLevel,
  Adviser,
  Mentor,
  Prisma,
  Student,
  User,
} from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { findUniqueAdviser } from "src/models/advisers.db";
import { findUniqueMentor } from "src/models/mentors.db";
import {
  createProject,
  getManyProjects,
  getManyProjectsLean,
  getOneProject,
  updateProject,
} from "src/models/projects.db";
import { findUniqueStudent } from "src/models/students.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { removePasswordFromUser } from "./users.helper";

/**
 * @function getProjectInputParser Parse the input returned from the prisma.project.find function
 * @param project The payload returned from prisma.project.find
 * @returns Project Record with flattened user data
 */
export const getProjectInputParser = (
  project: Prisma.ProjectGetPayload<{
    include: {
      mentor: { include: { user: true } };
      students: { include: { user: true } };
      adviser: { include: { user: true } };
    };
  }>
) => {
  const { mentor, students, adviser, ...projectData } = project;
  return {
    mentor: mentor ? parseMentorInProject(mentor) : undefined,
    students: students.map((student) => parseStudentInProject(student)),
    advisers: adviser ? parseAdviserInProject(adviser) : undefined,
    ...projectData,
  };
};

export const parseStudentInProject = (student: Student & { user: User }) => {
  const { user, ...studentData } = student;
  const userWithoutPassword = removePasswordFromUser(user);
  const { id, ...studentInfo } = studentData;
  return { studentId: id, ...userWithoutPassword, ...studentInfo };
};
export const parseAdviserInProject = (adviser: Adviser & { user: User }) => {
  const { user, ...adviserData } = adviser;
  const userWithoutPassword = removePasswordFromUser(user);
  const { id, ...adviserInfo } = adviserData;
  return { adviserId: id, ...userWithoutPassword, ...adviserInfo };
};
export const parseMentorInProject = (mentor: Mentor & { user: User }) => {
  const { user, ...mentorData } = mentor;
  const userWithoutPassword = removePasswordFromUser(user);
  const { id, ...mentorInfo } = mentorData;
  return { mentorId: id, ...userWithoutPassword, ...mentorInfo };
};

/**
 * @function getFilteredProjectsWhereInputParser Parse the query from the
 * HTTP Request and returns a query object for prisma.project.findMany
 * @param filter The raw filter object from the HTTP Request
 * @returns A filter object that works with prisma.project.findMany
 */
export const getFilteredProjectsWhereInputParser = (filter: any) => {
  let toReturn: Prisma.ProjectFindManyArgs = {
    include: {
      students: { include: { user: true } },
      mentor: { include: { user: true } },
      adviser: { include: { user: true } },
    },
  };

  if ((filter.page && !filter.limit) || (filter.limit && !filter.page)) {
    throw new SkylabError(
      `${
        filter.limit ? "Page" : "Limit"
      } parameter missing in a pagination query`,
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (filter.page && filter.limit) {
    toReturn = {
      ...toReturn,
      take: Number(filter.limit),
      skip: Number(filter.page) * Number(filter.limit),
    };
  }

  if (filter.achievement) {
    const achievement = <AchievementLevel[]>filter.achievement;
    toReturn = {
      ...toReturn,
      where: { achievement: { in: achievement } },
    };
  }

  if (filter.cohortYear) {
    const cohortYear = Number(filter.cohortYear);
    const cohortYearFilter: Prisma.ProjectWhereInput = {
      cohortYear: cohortYear,
    };
    toReturn = {
      ...toReturn,
      where: { ...toReturn.where, ...cohortYearFilter },
    };
  }

  if (filter.search) {
    const { where, ...filterData } = toReturn;
    const searchString = filter.search;
    toReturn = {
      ...filterData,
      where: {
        ...where,
        OR: [
          { name: { search: searchString } },
          { students: { some: { user: { name: { search: searchString } } } } },
          { mentor: { user: { name: { search: searchString } } } },
          { adviser: { user: { name: { search: searchString } } } },
        ],
      },
    };
  }

  return toReturn;
};

export const getOneProjectById = async (projectId: number) => {
  const projectWithId = getOneProject({ where: { id: projectId } });
  return projectWithId;
};

/**
 * @function getFilteredProjects Retrieve a list of projects that match the given query condition
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Project Records that match the given query
 */
export const getFilteredProjects = async (query: any) => {
  const filteredQuery = getFilteredProjectsWhereInputParser(query);
  const projects = await getManyProjects(filteredQuery);
  const parsedProjects = projects.map((project) => {
    return getProjectInputParser(project);
  });
  return parsedProjects;
};

export const getLeanProjects = async (cohortYear: number) => {
  const projects = await getManyProjectsLean({
    where: { cohortYear: cohortYear },
    select: { id: true, name: true },
  });
  return projects;
};

/**
 * @function createProjectInputParser Parse the query body received from
 * the HTTP Request to be passed to prisma.project.create
 * @param body The raw query body from the HTTP Request
 * @returns The create input to be passed to prisma.project.create
 */
export const createProjectInputParser = (
  body: any
): Prisma.ProjectCreateInput => {
  const { cohortYear, students, adviser, mentor, ...projectInfo } = body;
  const projectData = <Prisma.ProjectCreateInput>projectInfo;
  let createProjectInput = {
    ...projectData,
    cohort: { connect: { academicYear: Number(cohortYear) } },
  };

  if (adviser) {
    createProjectInput = {
      ...createProjectInput,
      adviser: { connect: { id: adviser } },
    };
  }

  if (mentor) {
    createProjectInput = {
      ...createProjectInput,
      mentor: { connect: { id: mentor } },
    };
  }

  if (students) {
    createProjectInput = {
      ...createProjectInput,
      students: {
        connect: students.map((student: number) => {
          return { id: student };
        }),
      },
    };
  }

  return createProjectInput;
};

/**
 * @function createProjectHelper Helper function to create a project
 * @param body The raw query body from the HTTP Request
 * @returns The project record created
 */
export const createProjectHelper = async (body: any) => {
  const projectCreateInput = createProjectInputParser(body);
  return await createProject(projectCreateInput);
};

export const roleUniqueIdentifierParser = (user: {
  userId: number;
  cohortYear: number;
}) => {
  return {
    userId_cohortYear: { userId: user.userId, cohortYear: user.cohortYear },
  };
};

export interface IAddUsersToProject {
  students?: Prisma.StudentUserIdCohortYearCompoundUniqueInput[];
  mentor?: Prisma.MentorUserIdCohortYearCompoundUniqueInput;
  adviser?: Prisma.AdviserUserIdCohortYearCompoundUniqueInput;
}

export const addUsersToProjectParser = (
  users: IAddUsersToProject
): Prisma.ProjectUpdateInput => {
  const students = users.students
    ? users.students.map((student) => roleUniqueIdentifierParser(student))
    : undefined;
  const mentor = users.mentor
    ? roleUniqueIdentifierParser(users.mentor)
    : undefined;
  const adviser = users.adviser
    ? roleUniqueIdentifierParser(users.adviser)
    : undefined;
  return {
    students: { connect: students },
    mentor: { connect: mentor },
    adviser: { connect: adviser },
  };
};

export const addUsersToProject = async (
  projectId: number,
  users: IAddUsersToProject
) => {
  await updateProject({
    where: { id: projectId },
    data: addUsersToProjectParser(users),
  });
};

export const getProjectsViaIds = async (users: {
  student?: number;
  adviser?: number;
  mentor?: number;
}) => {
  const { student, adviser, mentor } = users;

  if (student) {
    return await findUniqueStudent({
      where: { id: student },
      select: {
        project: { include: { students: true, mentor: true, adviser: true } },
      },
    });
  }

  if (adviser) {
    return findUniqueAdviser({
      where: { id: adviser },
      select: {
        projects: { include: { students: true, mentor: true, adviser: true } },
      },
    });
  }

  if (mentor) {
    return findUniqueMentor({
      where: { id: mentor },
      select: {
        projects: { include: { students: true, mentor: true, adviser: true } },
      },
    });
  }
};
