import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createOneSection(query: Prisma.SectionCreateArgs) {
  const createdSection = await prisma.section.create(query);
  return createdSection;
}

export async function deleteManySections(query: Prisma.SectionDeleteManyArgs) {
  const deletedSections = await prisma.section.deleteMany(query);
  return deletedSections;
}
