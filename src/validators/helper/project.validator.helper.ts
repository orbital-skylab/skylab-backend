import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const checkProjectExists = async (projectId: number) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    return project ? true : false;
  } catch (e) {
    return false;
  }
};
