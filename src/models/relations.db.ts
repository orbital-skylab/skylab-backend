import { Prisma } from "@prisma/client";
import { prisma } from "../client";

export async function createOneRelation(
  relation: Prisma.EvaluationRelationCreateArgs
) {
  return await prisma.evaluationRelation.create(relation);
}

export async function updateOneRelation(
  query: Prisma.EvaluationRelationUpdateArgs
) {
  return await prisma.evaluationRelation.update(query);
}

export async function findUniqueRelation(
  query: Prisma.EvaluationRelationFindUniqueArgs
) {
  return await prisma.evaluationRelation.findUnique(query);
}

export async function findManyRelations(
  query: Prisma.EvaluationRelationFindManyArgs
) {
  return await prisma.evaluationRelation.findMany(query);
}

export async function deleteOneRelation(
  relation: Prisma.EvaluationRelationDeleteArgs
) {
  return await prisma.evaluationRelation.delete(relation);
}

export async function deleteManyRelations(
  relations: Prisma.EvaluationRelationDeleteManyArgs
) {
  return await prisma.evaluationRelation.deleteMany(relations);
}
