import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstProject Find the first project record with the given query conditions
 * @param query The query conditions for the project
 * @returns The first project record that matches the query conditions
 */
export const getFirstProject = async ({
  include,
  ...query
}: Prisma.ProjectFindFirstArgs) => {
  const project = await prisma.project.findFirst({
    include: {
      ...include,
      adviser: { include: { user: true } },
      students: { include: { user: true } },
      mentor: { include: { user: true } },
    },
    ...query,
    rejectOnNotFound: false,
  });

  if (!project) {
    throw new SkylabError("Project was not found", HttpStatusCode.NOT_FOUND);
  }
  return project;
};

/**
 * @function getOneProject Find a unique project record with the given query conditions
 * @param query The query conditions for the project
 * @returns The project record that matches the query conditions
 */
export const getOneProject = async ({
  include,
  ...query
}: Prisma.ProjectFindUniqueArgs) => {
  const project = await prisma.project.findUnique({
    include: {
      ...include,
      adviser: { include: { user: true } },
      students: { include: { user: true } },
      mentor: { include: { user: true } },
    },
    ...query,
    rejectOnNotFound: false,
  });
  if (!project) {
    throw new SkylabError("Project was not found", HttpStatusCode.NOT_FOUND);
  }
  return project;
};

/**
 * @function getManyProjects Find all the projects that match the given conditions
 * @param query The query conditions to be selected upon
 * @returns The array of project records that match the query conditions
 */
export const getManyProjects = async ({
  include,
  ...query
}: Prisma.ProjectFindManyArgs) => {
  const projects = await prisma.project.findMany({
    include: {
      ...include,
      adviser: { include: { user: true } },
      students: { include: { user: true } },
      mentor: { include: { user: true } },
    },
    ...query,
  });
  return projects;
};

export const getManyProjectsLean = async (
  query: Prisma.ProjectFindManyArgs
) => {
  const projects = await prisma.project.findMany(query);
  return projects;
};

/**
 * @function createProject Create Project with the given project data
 * @param project Data of the project to be created
 * @returns The Project Record that was created
 */
export const createProject = async (project: Prisma.ProjectCreateInput) => {
  try {
    const newProject = await prisma.project.create({
      data: project,
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
