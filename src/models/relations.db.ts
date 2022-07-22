import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { prisma } from "../client";

export async function createOneRelation(
  relation: Prisma.EvaluationRelationCreateArgs
) {
  return await prisma.evaluationRelation.create(relation);
}

export async function createManyRelations(
  relations: Prisma.EvaluationRelationCreateManyArgs
) {
  try {
    return await prisma.evaluationRelation.createMany(relations);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Creating Evaluation Relations for group failed: One of the relations already exist",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw e;
  }
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
  return await prisma.evaluationRelation.findMany({
    ...query,
    orderBy: { fromProjectId: "asc", toProjectId: "asc" },
  });
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
