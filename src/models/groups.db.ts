import { Prisma } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { prisma } from "../client";

export async function findUniqueGroup(
  query: Prisma.EvaluationGroupFindUniqueArgs
) {
  const uniqueGroup = await prisma.evaluationGroup.findUnique({
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueGroup) {
    throw new SkylabError("Group was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueGroup;
}

export async function findManyGroups(
  query: Prisma.EvaluationGroupFindManyArgs
) {
  const groups = await prisma.evaluationGroup.findMany(query);
  return groups;
}

export async function createOneGroup(group: Prisma.EvaluationGroupCreateArgs) {
  const createdGroup = await prisma.evaluationGroup.create(group);
  return createdGroup;
}

export async function updateUniqueGroup(
  group: Prisma.EvaluationGroupUpdateArgs
) {
  const updatedGroup = await prisma.evaluationGroup.update(group);
  return updatedGroup;
}

export async function deleteUniqueGroup(
  query: Prisma.EvaluationGroupDeleteArgs
) {
  const deletedGroup = await prisma.evaluationGroup.delete(query);
  return deletedGroup;
}
