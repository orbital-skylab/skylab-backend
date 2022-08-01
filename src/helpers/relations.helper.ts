/* eslint-disable @typescript-eslint/no-explicit-any */
import { EvaluationRelation } from "@prisma/client";

import {
  createManyRelations,
  createOneRelation,
  deleteManyRelations,
  deleteOneRelation,
  findManyRelations,
  findUniqueRelation,
  updateOneRelation,
} from "src/models/relations.db";
import { parseGetAdviserInput } from "./advisers.helper";
import {
  getAdviserUserByProjectID,
  getProjectIDsByAdviserID,
} from "./projects.helper";

export async function createRelation(body: {
  relation: { fromProjectId: number; toProjectId: number };
}) {
  const { fromProjectId, toProjectId } = body.relation;
  const createdRelation = await createOneRelation({
    data: {
      fromProject: { connect: { id: fromProjectId } },
      toProject: { connect: { id: toProjectId } },
    },
  });
  return await findUniqueRelation({
    where: { id: createdRelation.id },
    include: { toProject: true, fromProject: true },
  });
}

export async function createRelationsByGroup(body: { projectIds: number[] }) {
  const { projectIds } = body;

  const createManyRelationArgs: {
    fromProjectId: number;
    toProjectId: number;
  }[] = [];

  for (const fromProjectId of projectIds) {
    for (const toProjectId of projectIds) {
      if (fromProjectId !== toProjectId) {
        createManyRelationArgs.push({
          fromProjectId: fromProjectId,
          toProjectId: toProjectId,
        });
      }
    }
  }

  return await createManyRelations({ data: createManyRelationArgs });
}

export async function getManyRelationsWithFilter(query: any) {
  const { from, to } = query;
  const relations = await findManyRelations({
    where: {
      fromProjectId: from ? Number(from) : undefined,
      toProjectId: to ? Number(to) : undefined,
    },
    include: { toProject: !to, fromProject: !from },
  });
  return await Promise.all(
    relations.map(async (relation: EvaluationRelation) => {
      return {
        ...relation,
        adviser: parseGetAdviserInput(
          await getAdviserUserByProjectID(relation.fromProjectId)
        ),
      };
    })
  );
}

export async function getManyRelationsWithAdviserID(adviserId: number) {
  const adviserProjects = await getProjectIDsByAdviserID(adviserId);
  const evaluationRelations = (
    await Promise.all(
      adviserProjects.map(async ({ id }) => {
        return await findManyRelations({
          where: { fromProjectId: id },
          include: { fromProject: true, toProject: true },
        });
      })
    )
  ).flat();

  return evaluationRelations;
}

export async function deleteEvaluationRelationByID(relationId: number) {
  const deletedRelation = await deleteOneRelation({
    where: { id: relationId },
  });
  return deletedRelation;
}

export async function deleteEvaluationRelationsOfProject(projectId: number) {
  const deletedRelations = await deleteManyRelations({
    where: { OR: [{ fromProjectId: projectId }, { toProjectId: projectId }] },
  });
  return deletedRelations;
}

export async function deleteEvaluationRelationsOfAdviser(adviserId: number) {
  const deletedRelations = await deleteManyRelations({
    where: {
      OR: [
        { fromProject: { adviserId: adviserId } },
        { toProject: { adviserId: adviserId } },
      ],
    },
  });
  return deletedRelations;
}

export async function editOneEvaluationRelationByRelationID(
  relationId: number,
  body: any
) {
  const { relation } = body;
  const { fromProjectId, toProjectId } = relation;
  return await updateOneRelation({
    where: { id: relationId },
    data: {
      fromProject: fromProjectId
        ? { connect: { id: fromProjectId } }
        : undefined,
      toProject: toProjectId ? { connect: { id: toProjectId } } : undefined,
    },
  });
}

export async function deleteEvaluationRelationByRelationID(relationId: number) {
  const deletedRelation = await deleteEvaluationRelationByID(
    Number(relationId)
  );
  return deletedRelation;
}
