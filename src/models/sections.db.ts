import { Prisma } from "@prisma/client";
import { prisma } from "../client";

export async function createOneSection(query: Prisma.SectionCreateArgs) {
  const createdSection = await prisma.section.create(query);
  return createdSection;
}

export async function deleteManySections(query: Prisma.SectionDeleteManyArgs) {
  const deletedSections = await prisma.section.deleteMany(query);
  return deletedSections;
}
