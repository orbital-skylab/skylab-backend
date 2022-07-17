import { Prisma } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { prisma } from "../client";

export async function findFirstProject(query: Prisma.ProjectFindFirstArgs) {
  const firstProject = await prisma.project.findFirst({
    ...query,
    rejectOnNotFound: false,
  });
  if (!firstProject) {
    throw new SkylabError("Project was not found", HttpStatusCode.BAD_REQUEST);
  }
  return firstProject;
}

export async function findUniqueProject(query: Prisma.ProjectFindUniqueArgs) {
  const uniqueProject = await prisma.project.findUnique({
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueProject) {
    throw new SkylabError("Project was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueProject;
}

export async function findUniqueProjectWithUserData({
  include,
  ...query
}: Prisma.ProjectFindUniqueArgs) {
  const uniqueProject = await prisma.project.findUnique({
    ...query,
    rejectOnNotFound: false,
    include: {
      ...include,
      students: { include: { user: true } },
      mentor: { include: { user: true } },
      adviser: { include: { user: true } },
    },
  });
  if (!uniqueProject) {
    throw new SkylabError("Project was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueProject;
}

export async function findManyProjects(query: Prisma.ProjectFindManyArgs) {
  const projects = await prisma.project.findMany(query);
  return projects;
}

export async function findManyProjectsWithUserData({
  include,
  ...query
}: Prisma.ProjectFindManyArgs) {
  const projects = await prisma.project.findMany({
    ...query,
    include: {
      ...include,
      students: { include: { user: true } },
      mentor: { include: { user: true } },
      adviser: { include: { user: true } },
    },
  });
  return projects;
}

export async function createOneProject(query: Prisma.ProjectCreateArgs) {
  const createdProject = await prisma.project.create(query);
  const projectWithUserData = await findUniqueProjectWithUserData({
    where: { id: createdProject.id },
  });
  return projectWithUserData;
}

export async function createManyProjects(query: Prisma.ProjectCreateManyArgs) {
  const createdProjects = await prisma.project.createMany(query);
  return createdProjects;
}

export async function updateOneProject(query: Prisma.ProjectUpdateArgs) {
  const updatedProject = await prisma.project.update(query);
  return updatedProject;
}

export async function deleteOneProject(query: Prisma.ProjectDeleteArgs) {
  const deletedProject = await prisma.project.delete(query);
  return deletedProject;
}
