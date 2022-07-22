/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createOneRelation,
  deleteManyRelations,
  deleteOneRelation,
  findManyRelations,
} from "src/models/relations.db";
import { getProjectIDsByAdviserID } from "./projects.helper";

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
  return createdRelation;
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
  return relations;
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
