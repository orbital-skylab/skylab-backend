/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createOneGroup,
  deleteUniqueGroup,
  findManyGroups,
  updateUniqueGroup,
} from "src/models/groups.db";

export async function getAllGroupsByAdviserID(adviserId: number) {
  const groups = await findManyGroups({
    where: { adviserId: adviserId },
    include: { projects: true },
  });
  return groups;
}

export async function createGroupWithAdviser(body: any) {
  const { projects, adviserId } = body;
  const createdGroup = await createOneGroup({
    data: {
      adviser: { connect: { id: Number(adviserId) } },
      projects: {
        connect: projects.map((id: number) => {
          return { id: id };
        }),
      },
    },
  });
  return createdGroup;
}

export async function editGroupByGroupID(groupId: number, body: any) {
  const { projects } = body;
  const updatedGroup = await updateUniqueGroup({
    where: { id: groupId },
    data: {
      projects: {
        connect: projects.map((id: number) => {
          return { id: id };
        }),
      },
    },
  });
  return updatedGroup;
}

export async function deleteGroupByGroupID(groupId: number) {
  const deletedGroup = await deleteUniqueGroup({ where: { id: groupId } });
  return deletedGroup;
}
