import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getAllProjects Return all projects in the database
 * @returns All Project Records in the database
 */
export const getAllProjects = async () => {
  const allProjects = await prisma.project.findMany({
    include: {
      students: { include: { user: true } },
      mentor: { include: { user: true } },
      adviser: { include: { user: true } },
    },
  });
  return allProjects;
};

/**
 * @function getManyProjects Return all the projects that match the given filter condition
 * @param filter The filter condition to search on
 * @returns The project records that match the given search condition
 */
export const getManyProjects = async (filter: Prisma.ProjectFindManyArgs) => {
  try {
    const filteredProjects = await prisma.project.findMany(filter);
    return filteredProjects;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

/**
 * @function createProject Create Project with the given project data
 * @param project Data of the project to be created
 * @returns The Project Record that was created
 */
export const createProject = async (project: Prisma.ProjectCreateInput) => {
  try {
    const newProject = await prisma.project.create({
      data: { ...project },
    });
    return newProject;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Project is not unique",
        HttpStatusCode.BAD_REQUEST
      );
    }

    if (e.code === "P2025") {
      throw new SkylabError(
        "No Cohort Data for the given academic year",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

/**
 * @function updateProject Update project using the given prisma arguments
 * @param updates Prisma arguments to update project
 */
export const updateProject = async (updates: Prisma.ProjectUpdateArgs) => {
  try {
    await prisma.project.update(updates);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
