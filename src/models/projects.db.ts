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
  const allProjects = await prisma.project.findMany();
  return allProjects;
};

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

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
