import { AchievementLevel, Prisma } from "@prisma/client";
import { equal } from "assert";
import { SkylabError } from "src/errors/SkylabError";
import {
  createProject,
  getManyProjects,
  updateProject,
} from "src/models/projects.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

/**
 * @function createProjectHelper Creates a new project with the data provided
 * @param projectInfo Project Information
 */
export const createProjectHelper = async (
  projectInfo: Prisma.ProjectCreateInput & { cohortYear?: number }
) => {
  const { cohortYear } = projectInfo;

  delete projectInfo["cohortYear"];

  await createProject({
    ...projectInfo,
    cohort: { connect: { academicYear: cohortYear } },
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const projectWhereInputParser = (filter: any) => {
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
      skip: (filter.page - 1) * filter.limit,
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
 * @function getManyProjectsHelper Helper function to parse input into getManyProjects
 * @param filter The filter condition to search on
 * @returns The records that match the given filter
 */
export const getManyProjectsHelper = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: any
) => {
  const parsedFilter = projectWhereInputParser(filter);
  const filteredProjects = await getManyProjects(parsedFilter);
  return filteredProjects;
};

/**
 * @function addStudentsToProject Function to connect students to their project
 * @param projectId ID of the project that the students are added to
 * @param studentUserIds Array of User IDs for the students to be added
 */
export const addStudentsToProject = async (
  projectId: number,
  studentUserIds: number[]
) => {
  const studentConnectIds = studentUserIds.map((studentId) => {
    return { userId: studentId };
  });
  await updateProject({
    where: { id: projectId },
    data: { students: { connect: studentConnectIds } },
  });
};
