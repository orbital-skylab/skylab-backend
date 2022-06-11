/* eslint-disable @typescript-eslint/no-explicit-any */
import { AchievementLevel, Prisma } from "@prisma/client";

import {
  createProject,
  getManyProjects,
  updateProject,
} from "src/models/projects.db";
import { getAdviserInputParser } from "./advisers.helper";
import { getMentorInputParser } from "./mentors.helper";
import { getStudentInputParser } from "./students.helper";

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
    mentor: mentor ? getMentorInputParser(mentor) : undefined,
    students: students.map((student) => getStudentInputParser(student)),
    advisers: adviser ? getAdviserInputParser(adviser) : undefined,
    ...projectData,
  };
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

  return toReturn;
};

/**
 * @function getFilteredProjects Retrieve a list of projects that match the given query condition
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Project Records that match the given query
 */
export const getFilteredProjects = async (query: any) => {
  const filteredQuery = getFilteredProjectsWhereInputParser(query);
  const projects = await getManyProjects(filteredQuery);
  const parsedProjects = projects.map((project) =>
    getProjectInputParser(project)
  );
  return parsedProjects;
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
  const { cohortYear, ...projectInfo } = body;
  const projectData = <Prisma.ProjectCreateInput>projectInfo;
  return {
    ...projectData,
    cohort: { connect: { academicYear: Number(cohortYear) } },
  };
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
